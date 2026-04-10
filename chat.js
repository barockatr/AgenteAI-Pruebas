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
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de rutas absolutas para el entorno
dotenv.config({ path: join(__dirname, '.env') });

// Groq Models
const MODEL_CHAT = 'llama-3.1-8b-instant';
const MODEL_ARCHITECT = 'llama-3.3-70b-versatile';

let sessionTokens = 0;



const ARCHITECT_RULES = `
- FORBIDDEN to use 'var'. Always use 'const' or 'let'.
- Absolute priority to ESM (ES Modules) over CommonJS.
- Single Responsibility Principle: Short and specific functions.
- Security: Do not use innerHTML (XSS risk).
- Performance: Prefer asynchronous functions (Non-blocking).
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
        const testResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'ping' }],
            model: 'llama-3.3-70b-versatile',
            max_tokens: 5
        });
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

        const auditResponse = await groq.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: `You are a Senior Software Architect. Analyze looking for: Vulnerabilities, Performance, Clean Code.\nRules:\n${ARCHITECT_RULES}` 
                },
                { role: 'user', content: `Audit:\n\n${content}` }
            ],
            model: MODEL_ARCHITECT
        });

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
    const systemPrompt = { 
        role: 'system', 
        content: `You are a Senior Assistant. Use tools when necessary.\nProject map:\n${projectMap}\n\nRULES:\n${ARCHITECT_RULES}` 
    };

    if (conversationHistory.length === 0 || conversationHistory[0].role !== 'system') {
        conversationHistory.unshift(systemPrompt);
    }

    conversationHistory.push({ role: 'user', content: userInput });
    await logAction('Question', userInput);

    try {
        let response = await groq.chat.completions.create({
            messages: conversationHistory,
            model: MODEL_CHAT,
            tools: toolsDefinition,
            tool_choice: 'auto'
        });

        let responseMessage = response.choices[0].message;
        sessionTokens += response.usage.total_tokens;
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

                if (name === 'readFileContent') result = await readFileContent(args.filePath);
                else if (name === 'createOrUpdateFile') result = await createOrUpdateFile(args.filePath, args.content);
                else if (name === 'listDirectoryRecursive') result = await listDirectoryRecursive();
                else if (name === 'auditFile') result = await performAudit(args.filePath);
                else if (name === 'updateArchitectureDocs') result = await updateArchitectureDocs(args.issue, args.fix);
                else if (name === 'webSearch') result = await webSearch(args.query);

                conversationHistory.push({
                    tool_call_id: callId,
                    role: 'tool',
                    name: name,
                    content: String(result)
                });
            }

            const secondResponse = await groq.chat.completions.create({
                messages: conversationHistory,
                model: MODEL_ARCHITECT
            });
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
    vigilancia.iniciar(); // Inicia Vigilancia Automáticamente
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
