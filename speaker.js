import say from 'say';

/**
 * Converts text to speech using the native system engine (ESM).
 * Returns a Promise for optional coordination — backward-compatible with fire-and-forget callers.
 * @param {string} text - The text to read.
 * @returns {Promise<void>}
 */
export function speak(text) {
    if (!text) return Promise.resolve();

    return new Promise((resolve) => {
        try {
            console.log('🔊 [Voice of Authority Active]');
            say.speak(text, null, 1.0, (err) => {
                if (err) console.error('Speech synthesis error:', err.message);
                resolve();
            });
        } catch (error) {
            console.error('Could not activate voice output:', error.message);
            resolve();
        }
    });
}
