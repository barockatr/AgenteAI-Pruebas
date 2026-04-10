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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ARCHITECT_RULES = `
- PROHIBIDO usar 'var'. Usa siempre 'const' o 'let'.
- Prioridad absoluta a ESM (ES Modules) sobre CommonJS.
- Principio de Responsabilidad Única: Funciones cortas y específicas.
- Seguridad: No usar innerHTML (riesgo XSS).
- Rendimiento: Preferir funciones asíncronas (No bloqueantes).
`;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Tú > '
});

let conversationHistory = [];
const MAX_MEMORY = 15;

/** 
 * Obtiene el mapa del proyecto (Async)
 */
async function getProjectMap() {
    try {
        return await listDirectoryRecursive();
    } catch (error) {
        return 'No se pudo leer el mapa.';
    }
}

/** 
 * Autodiagnóstico Inicial (ESM/Async)
 */
async function runSelfTest() {
    console.log('🔍 Iniciando autodiagnóstico (Async/ESM)...');
    try {
        const testResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'ping' }],
            model: 'llama-3.3-70b-versatile',
            max_tokens: 5
        });
        const fingerprint = testResponse.system_fingerprint || 'fp_active_session';
        console.log(`✅ Conexión establecida. Fingerprint: ${fingerprint}\n`);
    } catch (error) {
        console.error('❌ FALLO CRÍTICO:', error.message);
        process.exit(1);
    }
}

/** 
 * Auditoría profunda (Arquitecto)
 */
async function performAudit(filePath) {
    console.log(`🔎 Auditando ${filePath}...`);
    try {
        const content = await readFileContent(filePath);
        if (content.startsWith('Error') || content.startsWith('Acceso')) return content;

        const auditResponse = await groq.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: `Eres un Arquitecto de Software Senior. Analiza buscando: Vulnerabilidades, Rendimiento, Clean Code.\nReglas:\n${ARCHITECT_RULES}` 
                },
                { role: 'user', content: `Audita:\n\n${content}` }
            ],
            model: 'llama-3.3-70b-versatile'
        });

        const auditResult = auditResponse.choices[0].message.content;
        await logAction('Auditoría', { file: filePath, result: auditResult });

        const summary = auditResult.split('\n').filter(l => l.trim()).slice(0, 2).join(' ');
        speak(`Atención. He auditado ${filePath}. ${summary}`);

        return `### Revisión de Arquitectura para ${filePath}:\n${auditResult}`;
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

/** 
 * Turno de Chat
 */
async function processInteraction(userInput) {
    const projectMap = await getProjectMap();
    const systemPrompt = { 
        role: 'system', 
        content: `Eres un asistente Senior (ESM/Async). Mapa del proyecto:\n${projectMap}
        
        REGLAS ADN:
        ${ARCHITECT_RULES}
        
        PROACTIVIDAD: Al modificar archivos, incluye 'Revisión de Arquitectura'. Si el hallazgo es importante, usa 'updateArchitectureDocs'.` 
    };

    if (conversationHistory.length === 0 || conversationHistory[0].role !== 'system') {
        conversationHistory.unshift(systemPrompt);
    }

    conversationHistory.push({ role: 'user', content: userInput });
    await logAction('Pregunta', userInput);

    try {
        let response = await groq.chat.completions.create({
            messages: conversationHistory,
            model: 'llama-3.3-70b-versatile',
            tools: toolsDefinition,
            tool_choice: 'auto'
        });

        let responseMessage = response.choices[0].message;
        const toolCalls = responseMessage.tool_calls;

        if (toolCalls) {
            console.log('🛠️  Ejecutando herramientas (Async)...');
            conversationHistory.push(responseMessage);

            for (const toolCall of toolCalls) {
                const { name, arguments: argsJson } = toolCall.function;
                const args = JSON.parse(argsJson);
                let result = '';

                console.log(`  └─ Herramienta: ${name}`);
                await logAction('Tool_Call', { function: name, args });

                if (name === 'readFileContent') result = await readFileContent(args.filePath);
                else if (name === 'createOrUpdateFile') result = await createOrUpdateFile(args.filePath, args.content);
                else if (name === 'listDirectoryRecursive') result = await listDirectoryRecursive();
                else if (name === 'auditFile') result = await performAudit(args.filePath);
                else if (name === 'updateArchitectureDocs') result = await updateArchitectureDocs(args.issue, args.fix);

                conversationHistory.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: name,
                    content: result
                });
            }

            const secondResponse = await groq.chat.completions.create({
                messages: conversationHistory,
                model: 'llama-3.3-70b-versatile'
            });
            responseMessage = secondResponse.choices[0].message;
        }

        const content = responseMessage.content;
        console.log(`\n🤖 IA: ${content}\n`);
        await logAction('Respuesta', { content, tokens: response.usage.total_tokens });

        if (content.includes('Revisión de Arquitectura')) {
            const architectPart = content.split('Revisión de Arquitectura')[1];
            const summary = architectPart.split('\n').filter(l => l.trim()).slice(0, 2).join(' ');
            speak(`Arquitecto informa. ${summary}`);
        }

        conversationHistory.push(responseMessage);
        if (conversationHistory.length > MAX_MEMORY) {
            conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-(MAX_MEMORY - 1))];
        }

    } catch (error) {
        await logAction('Error', error.message);
        console.error('❌ Error:', error.message);
    }
}

/**
 * REPL
 */
async function startApp() {
    await runSelfTest();
    console.log('--- AGENTE REFACTORIZADO (ESM/ASYNC) ACTIVO ---');
    console.log('Comandos: salir, exit, /clear, /voice\n');
    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'salir') process.exit(0);
        if (input === '/clear') {
            conversationHistory = [];
            console.log('🧹 Memoria limpia.');
        } else if (input.toLowerCase() === '/voice') {
            const transcript = await listenAndTranscribe();
            if (transcript) {
                console.log(`🎤 Dicho: "${transcript}"`);
                await processInteraction(transcript);
            }
        } else if (input) {
            await processInteraction(input);
        }
        rl.prompt();
    });
}

startApp();
