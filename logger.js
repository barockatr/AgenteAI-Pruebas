const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(process.cwd(), 'agent.log');

/**
 * Registra un evento en el archivo de auditoría agent.log.
 * @param {string} eventType - Tipo de evento (Pregunta, Respuesta, Tool_Call, Error).
 * @param {any} data - Información adicional a registrar.
 */
function logAction(eventType, data) {
    try {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const logEntry = `[${timestamp}] [${eventType.toUpperCase()}] ${typeof data === 'object' ? JSON.stringify(data) : data}\n`;

        fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
    } catch (error) {
        console.error('Error al escribir en el log:', error.message);
    }
}

module.exports = { logAction };
