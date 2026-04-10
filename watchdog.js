"use strict";

import chokidar from 'chokidar';
import { logAction } from './logger.js';

/**
 * Módulo de Vigilancia (Watchdog)
 * Se encarga de monitorear cambios en el sistema de archivos del proyecto.
 */
const vigilancia = {
    /**
     * Inicia el monitoreo de archivos.
     */
    iniciar: () => {
        console.log('📡 [Watchdog] Sistema de vigilancia activo monitoreando el repositorio...');
        
        const watcher = chokidar.watch('.', {
            ignored: [
                /(^|[\/\\])\../, // Ignorar archivos ocultos
                'node_modules',
                'agent.log',
                '.git'
            ],
            persistent: true,
            ignoreInitial: true
        });

        watcher.on('all', async (event, path) => {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] 🔍 Cambio detectado (${event}): ${path}`);
            await logAction('Watchdog', { event, path });
        });

        return watcher;
    }
};

export { vigilancia };