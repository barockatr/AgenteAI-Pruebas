import say from 'say';

/**
 * Converts text to speech using the native system engine (ESM).
 * @param {string} text - The text to read.
 */
export function speak(text) {
    if (!text) return;

    try {
        console.log('🔊 [Voice of Authority Active]');
        say.speak(text, null, 1.0, (err) => {
            if (err) {
                console.error('Speech synthesis error:', err.message);
            }
        });
    } catch (error) {
        console.error('Could not activate voice output:', error.message);
    }
}
