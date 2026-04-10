import fs from 'fs';
import { join } from 'path';
import mic from 'mic';
import groq from './client.js';

/**
 * Graba audio por 6 segundos y lo transcribe usando Groq Whisper (ESM).
 * @returns {Promise<string>} La transcripción del audio o un mensaje de error.
 */
export async function listenAndTranscribe() {
    return new Promise((resolve) => {
        const tempFile = join(process.cwd(), 'temp_voice.wav');
        const micInstance = mic({
            rate: '16000',
            channels: '1',
            debug: false,
            exitOnSilence: 0
        });

        const micInputStream = micInstance.getAudioStream();
        const outputFileStream = fs.createWriteStream(tempFile);

        micInputStream.pipe(outputFileStream);

        console.log('\n🎤 [Escuchando... 6s]');
        micInstance.start();

        setTimeout(async () => {
            micInstance.stop();
            outputFileStream.end();

            console.log('⏳ Procesando audio...');

            try {
                const transcription = await groq.audio.transcriptions.create({
                    file: fs.createReadStream(tempFile),
                    model: 'whisper-large-v3',
                    language: 'es'
                });

                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

                resolve(transcription.text);
            } catch (error) {
                console.error('Error al transcribir:', error.message);
                resolve('');
            }
        }, 6000);

        micInputStream.on('error', (err) => {
            console.error('Error con el micrófono:', err.message);
            micInstance.stop();
            resolve('');
        });
    });
}
