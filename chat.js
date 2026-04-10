const fs = require('fs');
const readline = require('readline');
const groq = require('./client');
const { toolsDefinition, readFileContent, createOrUpdateFile } = require('./tools');
const { logAction } = require('./logger');

// Configuración de la interfaz de consola
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Tú > '
});

// Estado global de la sesión
let conversationHistory = [];
const MAX_MEMORY = 15;

/**
 * Escanea el directorio actual para obtener el contexto de archivos.
 */
function readProjectContext() {
    try {
        const ignoreList = ['node_modules', '.git', 'package-lock.json', 'agent.log'];
        return fs.readdirSync(__dirname)
            .filter(file => !ignoreList.includes(file))
            .join(', ');
    } catch (error) {
        return 'No se pudo leer el contexto.';
    }
}

/**
 * Realiza el autodiagnóstico inicial.
 */
async function runSelfTest() {
    console.log('🔍 Iniciando autodiagnóstico...');
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
 * Procesa una interacción completa con la IA, incluyendo herramientas.
 */
async function processInteraction(userInput) {
    const projectFiles = readProjectContext();
    const systemPrompt = { 
        role: 'system', 
        content: `Eres un asistente de desarrollo. Archivos actuales: ${projectFiles}. Tienes capacidad de leer y escribir archivos.` 
    };

    // Aseguramos que el system prompt siempre sea el primero
    if (conversationHistory.length === 0 || conversationHistory[0].role !== 'system') {
        conversationHistory.unshift(systemPrompt);
    }

    conversationHistory.push({ role: 'user', content: userInput });
    logAction('Pregunta', userInput);

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
            console.log('🛠️  Ejecutando herramientas...');
            conversationHistory.push(responseMessage);

            for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);

                logAction('Tool_Call', { function: functionName, args });

                let result = '';
                if (functionName === 'readFileContent') {
                    result = readFileContent(args.filePath);
                } else if (functionName === 'createOrUpdateFile') {
                    result = createOrUpdateFile(args.filePath, args.content);
                    logAction('Escritura', { file: args.filePath });
                }

                conversationHistory.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: functionName,
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
        const tokens = response.usage.total_tokens;

        console.log(`\n🤖 IA: ${content}\n`);
        logAction('Respuesta', { content, tokens });

        if (tokens > 1500) {
            console.warn(`\x1b[33m⚠️  ALERTA DE COSTO: Límite de tokens excedido (${tokens})\x1b[0m`);
        }

        conversationHistory.push(responseMessage);

        // Optimización de memoria (Keep last MAX_MEMORY messages)
        if (conversationHistory.length > MAX_MEMORY) {
            conversationHistory = [
                conversationHistory[0], // Mantener siempre el system prompt
                ...conversationHistory.slice(-(MAX_MEMORY - 1))
            ];
        }

    } catch (error) {
        logAction('Error', error.message);
        console.error('❌ Error:', error.message);
    }
}

/**
 * Bucle Principal REPL
 */
async function startApp() {
    await runSelfTest();
    
    console.log('--- AGENTE INTERACTIVO ACTIVO ---');
    console.log('Comandos: "salir" o "exit" para cerrar | "/clear" para resetear memoria\n');

    rl.prompt();

    rl.on('line', async (line) => {
        const input = line.trim();

        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'salir') {
            console.log('Cerrando sesión. ¡Hasta pronto!');
            process.exit(0);
        }

        if (input === '/clear') {
            conversationHistory = [];
            console.log('🧹 Memoria reseteada.');
            rl.prompt();
            return;
        }

        if (input) {
            await processInteraction(input);
        }

        rl.prompt();
    }).on('close', () => {
        process.exit(0);
    });
}

startApp();
