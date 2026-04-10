import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

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

        return new Groq({
            apiKey: apiKey
        });

    } catch (error) {
        console.error('Error al inicializar el cliente de Groq:', error.message);
        process.exit(1);
    }
}

const groq = initializeGroqClient();

export default groq;
