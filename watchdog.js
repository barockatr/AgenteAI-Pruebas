"use strict";

import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import { logAction } from './logger.js';

class WatchdogEmitter extends EventEmitter {}
const watchdogEvents = new WatchdogEmitter();

let debounceTimer = null;
const DEBOUNCE_MS = 3000;
let pendingChanges = new Set();

/**
 * Módulo de Vigilancia (Watchdog 2.0)
 * Monitorea cambios con EventEmitter y un Debounce Timer de 3 segundos
 * para no saturar la consola ni a la IA.
 */
const vigilancia = {
    events: watchdogEvents,

    iniciar: () => {
        console.log('📡 [Watchdog 2.0] Sistema de vigilancia activo monitoreando el repositorio...');
        
        const watcher = chokidar.watch('.', {
            ignored: [
                /(^|[\/\\])\../, // Ignorar archivos ocultos
                'node_modules',
                'agent.log',
                '.git',
                'vector_store.json'
            ],
            persistent: true,
            ignoreInitial: true
        });

        watcher.on('all', async (event, path) => {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] 🔍 Cambio detectado vía FS: ${path}`);
            await logAction('Watchdog', { event, path });

            // Acumular los paths modificados
            pendingChanges.add(`${event}: ${path}`);

            // Reiniciar el timer de debounce
            clearTimeout(debounceTimer);
            
            debounceTimer = setTimeout(() => {
                // Emitir evento agrupado
                const summary = Array.from(pendingChanges).join(', ');
                pendingChanges.clear(); // Limpiamos para el próximo lote
                watchdogEvents.emit('changesDetected', summary);
            }, DEBOUNCE_MS);
        });

        return watcher;
    }
};

export { vigilancia };