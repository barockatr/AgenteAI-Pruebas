import { appendFile } from 'fs/promises';
import { join } from 'path';

const LOG_FILE = join(process.cwd(), 'agent.log');

/**
 * Registra un evento en el archivo de auditoría agent.log de forma asíncrona.
 * @param {string} eventType - Tipo de evento.
 * @param {any} data - Información adicional a registrar.
 */
export async function logAction(eventType, data) {
    try {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const logEntry = `[${timestamp}] [${eventType.toUpperCase()}] ${typeof data === 'object' ? JSON.stringify(data) : data}\n`;

        await appendFile(LOG_FILE, logEntry, 'utf8');
    } catch (error) {
        console.error('Error al escribir en el log:', error.message);
    }
}
