#!/usr/bin/env node
import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import groq from './client.js';
import { toolsDefinition, readFileContent, createOrUpdateFile, listDirectoryRecursive, updateArchitectureDocs } from './tools.js';
import { logAction } from './logger.js';
import { speak } from './speaker.js';
import { listenAndTranscribe } from './listener.js';
import { vigilancia } from './watchdog.js';
import { webSearch } from './researcher.js';
import { withRetry } from './retry.js';
import { memoryStore } from './memory.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de rutas absolutas para el entorno
dotenv.config({ path: join(__dirname, '.env') });

// Groq Models
const MODEL_CHAT = 'llama-3.1-8b-instant';
const MODEL_ARCHITECT = 'llama-3.3-70b-versatile';

let sessionTokens = 0;

/**
 * Tool Registry — Maps tool names to their handler functions.
 * Adding a new tool = one line here + one entry in toolsDefinition (tools.js).
 */
const toolRegistry = {
    readFileContent:        (args) => readFileContent(args.filePath),
    createOrUpdateFile:     (args) => createOrUpdateFile(args.filePath, args.content),
    listDirectoryRecursive: ()     => listDirectoryRecursive(),
    auditFile:              (args) => performAudit(args.filePath),
    updateArchitectureDocs: (args) => updateArchitectureDocs(args.issue, args.fix),
    webSearch:              (args) => webSearch(args.query),
};



const ARCHITECT_RULES = `
Actúa siempre como un Ingeniero de Software Senior & Arquitecto Full-Stack. Tus principios operativos son:

1. Vanguardia Técnica: Prioriza siempre los estándares más recientes (ESM, Async/Await, ES2024+). No usar 'var'.
2. Calidad de Entrega (Clean Code): Todo output debe ser profesional. Prohibido entregar JSONs crudos; usa formateo avanzado (como console.table) y unidades claras.
3. Arquitectura Robusta: Todo código debe incluir manejo de errores profesional (try/catch), Single Responsibility Principle y estructura modular.
4. Conciencia de Contexto: Antes de actuar, verifica el package.json para asegurar compatibilidad total.
5. Seguridad y Rendimiento: Prohibido usar innerHTML (riesgo XSS). Prefiere siempre funciones asíncronas no bloqueantes.

6. Gestión Inteligente de Tokens y Tiempos (Doble Candado):
   - Fragmentación Dinámica: Si una tarea es masiva, divídela en fases ejecutables. NO intentes resolver todo en una sola respuesta.
   - Checkpoints con Temporizador: Al final de cada fragmento, DEBES:
     a) Resumir qué se hizo y qué falta (Estado del Hilo).
     b) Cálculo de Espera: Estimar el tiempo necesario para resetear la cuota de TPM (Tokens Per Minute).
        - Respuesta simple (< 500 tokens): espera de 10 segundos.
        - Respuesta media (500-1500 tokens): espera de 20 segundos.
        - Respuesta compleja (> 1500 tokens): espera de 30 segundos.
     c) Instrucción de Reanudación: Notificar al usuario con el formato:
        "He completado la Fase X [Breve descripción]. Para evitar bloqueos de la API (Error 429/413), por favor espera [N] segundos antes de escribir 'continúa' para proceder con la Fase Y."
   - Prioridad Técnica: En situaciones de saturación, omitir reportes extensos y priorizar la entrega del código en bloques funcionales que el usuario pueda ir probando.
   - Respuestas Compactas: NUNCA generar explicaciones largas ni informes de arquitectura extensos cuando se esté cerca del límite de tokens. Código funcional primero, documentación después.

7. Resolución Autónoma: Si una herramienta falla, analiza el log, diagnostica el error y ejecuta una solución alternativa de inmediato.
`;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'You > '
});

let conversationHistory = [];
const MAX_MEMORY = 15;

/** 
 * Gets the project map (Async)
 */
async function getProjectMap() {
    try {
        return await listDirectoryRecursive();
    } catch (error) {
        return 'Could not read the map.';
    }
}

/** 
 * Initial Self-Diagnostic (ESM/Async)
 */
async function runSelfTest() {
    console.log('🔍 Starting self-diagnostic (Async/ESM)...');
    try {
        const testResponse = await withRetry(() => groq.chat.completions.create({
            messages: [{ role: 'user', content: 'ping' }],
            model: 'llama-3.3-70b-versatile',
            max_tokens: 5
        }));
        const fingerprint = testResponse.system_fingerprint || 'fp_active_session';
        console.log(`✅ Connection established. Fingerprint: ${fingerprint}\n`);
    } catch (error) {
        console.error('❌ CRITICAL FAILURE:', error.message);
        process.exit(1);
    }
}

/** 
 * Deep Audit (Architect)
 */
export async function performAudit(filePath, silent = false) {
    if (!silent) console.log(`🔎 Auditing ${filePath}...`);

    try {
        const content = await readFileContent(filePath);
        if (content.startsWith('Error') || content.startsWith('Acceso')) return content;

        const auditResponse = await withRetry(() => groq.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: `Eres un Ingeniero Senior & Arquitecto de Software. Analiza el código buscando vulnerabilidades, rendimiento y limpieza.\n\nREGLAS DE ARQUITECTURA:\n${ARCHITECT_RULES}` 
                },
                { role: 'user', content: `Audit:\n\n${content}` }
            ],
            model: MODEL_ARCHITECT
        }));

        const auditResult = auditResponse.choices[0].message.content;
        sessionTokens += auditResponse.usage.total_tokens;
        await logAction('Audit', { file: filePath, result: auditResult });

        if (!silent) {
            const summary = auditResult.split('\n').filter(l => l.trim()).slice(0, 2).join(' ');
            speak(`Attention. I have audited ${filePath}. ${summary}`);
        }


        return `### Architecture Review for ${filePath}:\n${auditResult}`;
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

/** 
 * Chat Turn
 */
async function processInteraction(userInput) {
    const projectMap = await getProjectMap();
    const memories = await memoryStore.searchSimilar(userInput);
    let memoryContext = '';
    if (memories.length > 0) {
        memoryContext = '\n[Memoria a Largo Plazo Relevante]:\n' + memories.map(m => `- [${m.file_context}] ${m.text}`).join('\n');
    }

    const systemPrompt = { 
        role: 'system', 
        content: `Eres un Asistente Senior de Ingeniería. Usa las herramientas con autonomía y precisión.\n\nMapa del proyecto:\n${projectMap}${memoryContext}\n\nREGLAS DE ARQUITECTURA:\n${ARCHITECT_RULES}` 
    };

    if (conversationHistory.length === 0 || conversationHistory[0].role !== 'system') {
        conversationHistory.unshift(systemPrompt);
    } else {
        conversationHistory[0] = systemPrompt; // Actualizar memoria en cada turno
    }

    conversationHistory.push({ role: 'user', content: userInput });
    await logAction('Question', userInput);
    const timeStart = Date.now();

    try {
        let response = await withRetry(() => groq.chat.completions.create({
            messages: conversationHistory,
            model: MODEL_CHAT,
            tools: toolsDefinition,
            tool_choice: 'auto'
        }));

        let responseMessage = response.choices[0].message;
        const latencyMs = Date.now() - timeStart;
        sessionTokens += response.usage.total_tokens;
        await logAction('Inferencia', { latency_ms: latencyMs, tokens: response.usage.total_tokens });
        
        const toolCalls = responseMessage.tool_calls;


        if (toolCalls) {
            console.log('🛠️  Executing tools (Async)...');
            conversationHistory.push(responseMessage);

            for (const toolCall of toolCalls) {
                const name = toolCall.function?.name || toolCall.name;
                const argsJson = toolCall.function?.arguments || "{}";
                let args = {};
                try {
                    args = typeof argsJson === 'string' ? JSON.parse(argsJson) : argsJson;
                } catch (e) {
                    console.error(`⚠️  Warning: Invalid JSON in arguments for ${name}.`);
                }
                const callId = toolCall.id || `call_${Date.now()}`;
                let result = '';

                console.log(`  └─ Tool: ${name}`);
                await logAction('Tool_Call', { function: name, args });

                const handler = toolRegistry[name];
                if (handler) {
                    result = await handler(args);
                } else {
                    result = `Error: Unknown tool "${name}"`;
                }

                conversationHistory.push({
                    tool_call_id: callId,
                    role: 'tool',
                    name: name,
                    content: String(result)
                });
            }

            const secondResponse = await withRetry(() => groq.chat.completions.create({
                messages: conversationHistory,
                model: MODEL_ARCHITECT
            }));
            responseMessage = secondResponse.choices[0].message;
            sessionTokens += secondResponse.usage.total_tokens;
        }


        const content = responseMessage.content;
        console.log(`\n🤖 AI: ${content}\n`);
        await logAction('Response', { content, tokens: response.usage.total_tokens });

        if (content.includes('Architecture Review')) {
            const architectPart = content.split('Architecture Review')[1];
            const summary = architectPart.split('\n').filter(l => l.trim()).slice(0, 2).join(' ');
            speak(`Architect reports. ${summary}`);
        }

        conversationHistory.push(responseMessage);
        
        if (conversationHistory.length > MAX_MEMORY) {
            conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-(MAX_MEMORY - 1))];
        }

        // Add memory asynchronously
        await memoryStore.addMemory(`User: ${userInput}\nAI: ${content || 'Utilizó herramientas'}`, 'chat_repl');

    } catch (error) {
        await logAction('Error', error.message);
        console.error('❌ Error:', error.message);
    }
}

/**
 * REPL
 */
async function startApp() {
    await memoryStore.init(); // Inicializar RAG
    await runSelfTest();
    
    vigilancia.iniciar(); // Inicia Vigilancia
    
    // Conectar el watcher asíncronamente
    vigilancia.events.on('changesDetected', async (summary) => {
        console.log(`\n🔔 [Agente] Eventos FS detectados asíncronamente: ${summary}`);
        await processInteraction(`[Automático] He detectado cambios en estos archivos: ${summary}. Analiza e infórmame brevemente si se requiere alguna acción por tu parte.`);
        rl.prompt();
    });

    console.log('--- INTELLIGENT AGENT (WATCHDOG/STRATEGIST) ACTIVE ---');
    console.log('Commands: exit, /clear, /voice, /usage\n');

    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'salir') process.exit(0);
        if (input === '/clear') {
            conversationHistory = [];
            console.log('🧹 Memory cleared.');
        } else if (input === '/usage') {
            console.log(`📊 Session consumption: ${sessionTokens} tokens.`);
        } else if (input.toLowerCase() === '/voice') {

            const transcript = await listenAndTranscribe();
            if (transcript) {
                console.log(`🎤 Said: "${transcript}"`);
                await processInteraction(transcript);
            }
        } else if (input) {
            await processInteraction(input);
        }
        rl.prompt();
    });
}

startApp();
