import chokidar from 'chokidar';
import { performAudit } from './chat.js';
import { speak } from './speaker.js';

/**
 * The Sentinel: Watches for real-time changes and triggers audits.
 */
export function startWatchdog() {
    const watchPath = process.cwd();
    const watcher = chokidar.watch(watchPath, {
        ignored: ['node_modules', '.git', 'agent.log', 'temp_voice.wav', 'ARCHITECTURE.md', 'package.json', 'package-lock.json'],
        persistent: true,
        ignoreInitial: true
    });

    console.log(`🛡️  [Sentinel Active] Watching project root: ${watchPath}`);

    const handleEvent = async (event, path) => {
        if (!path.endsWith('.js') && !path.endsWith('.css')) return;

        console.log(`📡 [Event detected: ${event}] in ${path}`);
        
        const auditResult = await performAudit(path, true);
        
        // Expanded alert dictionary for maximum sensitivity
        const alertKeywords = ['critical', 'vulnerability', 'risk', 'security', 'xss', 'attack', 'warning', 'danger'];
        const lowResult = auditResult.toLowerCase();
        
        const hasRisk = alertKeywords.some(keyword => lowResult.includes(keyword));

        if (hasRisk) {
            speak(`Security alert detected in ${path}. Check the console.`);
            console.warn(`\n⚠️  [SENTINEL ALERT] Finding in ${path}:\n${auditResult.substring(0, 300)}...\n`);
        } else {
            console.log(`✅ [Sentinel] ${path} reviewed with no critical risks.`);
        }
    };

    watcher.on('add', (path) => handleEvent('add', path));
    watcher.on('change', (path) => handleEvent('change', path));

    return watcher;
}
