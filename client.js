require('dotenv').config();
const Groq = require('groq-sdk');

/**
 * Inicializa y configura el cliente de Groq.
 * @returns {Groq} Instancia configurada del cliente de Groq.
 */
function initializeGroqClient() {
    try {
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('La variable de entorno GROQ_API_KEY no está definida en el archivo .env');
        }

        // Retornamos la instancia del cliente para uso global
        return new Groq({
            apiKey: apiKey
        });

    } catch (error) {
        console.error('Error al inicializar el cliente de Groq:', error.message);
        process.exit(1); // Detenemos la ejecución si no hay configuración válida
    }
}

const groq = initializeGroqClient();

module.exports = groq;
