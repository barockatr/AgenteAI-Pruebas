import { appendFile } from 'fs/promises';
import { join } from 'path';

const LOG_FILE = join(process.cwd(), 'agent.log');

/**
 * Logs an event asynchronously to the agent.log audit file.
 * @param {string} eventType - Event type.
 * @param {any} data - Additional information to log.
 */
export async function logAction(eventType, data) {
    try {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const logEntry = `[${timestamp}] [${eventType.toUpperCase()}] ${typeof data === 'object' ? JSON.stringify(data) : data}\n`;

        await appendFile(LOG_FILE, logEntry, 'utf8');
    } catch (error) {
        console.error('Error writing to log:', error.message);
    }
}
