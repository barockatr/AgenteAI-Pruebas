import { vigilancia } from './watchdog.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configuración de rutas absolutas para el entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

/**
 * Servicio de Fondo - Punto de entrada independiente
 * Ejecuta la vigilancia una sola vez como proceso persistente.
 */
async function ejecutarServicio() {
    try {
        vigilancia.iniciar();
    } catch (error) {
        console.error('❌ Error en el servicio de fondo:', error);
    }
}

// Iniciar ejecución única
ejecutarServicio();

export { ejecutarServicio as servicio };