import chokidar from 'chokidar';
import { performAudit } from './chat.js';
import { speak } from './speaker.js';

/**
 * El Guardián: Vigila cambios en tiempo real y dispara auditorías.
 */
export function startWatchdog() {
    const watcher = chokidar.watch('.', {
        ignored: ['node_modules', '.git', 'agent.log', 'temp_voice.wav', 'ARCHITECTURE.md', 'package.json', 'package-lock.json'],
        persistent: true,
        ignoreInitial: true
    });

    console.log('🛡️  [Guardián Activo] Vigilando raíz y directorios del proyecto...');

    const handleEvent = async (event, path) => {
        if (!path.endsWith('.js') && !path.endsWith('.css')) return;

        console.log(`📡 [Evento detectado: ${event}] en ${path}`);
        
        const auditResult = await performAudit(path, true);
        
        // Diccionario de alertas ampliado para máxima sensibilidad
        const alertKeywords = ['crítico', 'vulnerabilidad', 'riesgo', 'seguridad', 'xss', 'ataque', 'advertencia', 'peligro'];
        const lowResult = auditResult.toLowerCase();
        
        const hasRisk = alertKeywords.some(keyword => lowResult.includes(keyword));

        if (hasRisk) {
            speak(`Alerta detectada en ${path}. Revisa la consola.`);
            console.warn(`\n⚠️  [ALERTA DEL GUARDIÁN] Hallazgo en ${path}:\n${auditResult.substring(0, 300)}...\n`);
        } else {
            console.log(`✅ [Guardián] ${path} revisado sin riesgos críticos.`);
        }
    };

    watcher.on('add', (path) => handleEvent('add', path));
    watcher.on('change', (path) => handleEvent('change', path));

    return watcher;
}
