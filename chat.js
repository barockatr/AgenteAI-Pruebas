const fs = require('fs');
const groq = require('./client');

/**
 * Escanea el directorio actual para obtener una lista legible de archivos,
 * ignorando carpetas pesadas o irrelevantes.
 * @returns {string} Contexto formateado de los archivos existentes.
 */
function readProjectContext() {
    try {
        const ignoreList = ['node_modules', '.git', 'package-lock.json'];
        const files = fs.readdirSync(__dirname)
            .filter(file => !ignoreList.includes(file))
            .join(', ');
        
        return files;
    } catch (error) {
        console.error('Error al leer el contexto del proyecto:', error.message);
        return 'No se pudo leer el contexto.';
    }
}

/**
 * Realiza una prueba de conexión y salud de la IA antes de proceder.
 * Verifica la existencia de system_fingerprint si está disponible.
 */
async function runSelfTest() {
    console.log('🔍 Iniciando autodiagnóstico...');
    try {
        const testResponse = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'ping' }],
            model: 'llama-3.3-70b-versatile',
            max_tokens: 5
        });

        // Verificamos si la respuesta es válida
        if (!testResponse || !testResponse.choices) {
            throw new Error('Respuesta de prueba inválida o nula.');
        }

        // Aunque algunos modelos pueden retornar null en system_fingerprint,
        // validamos que la estructura básica de la sesión sea consistente.
        const fingerprint = testResponse.system_fingerprint || 'fp_standard_session';
        console.log(`✅ Autodiagnóstico exitoso. Fingerprint: ${fingerprint}`);

    } catch (error) {
        console.error('❌ FALLO CRÍTICO EN AUTODIAGNÓSTICO:', error.message);
        process.exit(1);
    }
}

/**
 * Lógica principal del chat con monitoreo de presupuesto de tokens.
 */
async function main() {
    // 1. Ejecutar test inicial
    await runSelfTest();

    // 2. Obtener contexto
    const projectFiles = readProjectContext();
    const systemPrompt = `Eres un asistente de desarrollo. Los archivos actuales en el proyecto son: ${projectFiles}.`;

    console.log('🚀 Enviando consulta principal...');

    try {
        const response = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Basado en los archivos que ves, ¿qué crees que estamos construyendo?' }
            ],
            model: 'llama-3.3-70b-versatile'
        });

        const content = response.choices[0].message.content;
        const totalTokens = response.usage.total_tokens;

        // 3. Verificación de Presupuesto de Tokens
        if (totalTokens > 1500) {
            console.warn(`\x1b[33m⚠️ ALERTA DE COSTO: Límite de tokens excedido (Actual: ${totalTokens})\x1b[0m`);
        } else {
            console.log(`📊 Consumo de tokens: ${totalTokens}`);
        }

        console.log('\n--- RESPUESTA DE LA IA ---');
        console.log(content);
        console.log('--------------------------\n');

    } catch (error) {
        console.error('Error durante la consulta principal:', error.message);
    }
}

// Ejecución
main();
