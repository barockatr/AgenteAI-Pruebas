import say from 'say';

/**
 * Convierte texto a voz usando el motor nativo del sistema (ESM).
 * @param {string} text - El texto a leer.
 */
export function speak(text) {
    if (!text) return;

    try {
        console.log('🔊 [Voz de Autoridad Activa]');
        say.speak(text, null, 1.0, (err) => {
            if (err) {
                console.error('Error en la síntesis de voz:', err.message);
            }
        });
    } catch (error) {
        console.error('No se pudo activar la salida de voz:', error.message);
    }
}
