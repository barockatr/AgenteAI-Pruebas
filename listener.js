import fs from 'fs';
import { join } from 'path';
import mic from 'mic';
import groq from './client.js';

/**
 * Records audio for 6 seconds and transcribes it using Groq Whisper (ESM).
 * @returns {Promise<string>} The audio transcription or an error message.
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

        console.log('\n🎤 [Listening... 6s]');
        micInstance.start();

        setTimeout(async () => {
            micInstance.stop();
            outputFileStream.end();

            console.log('⏳ Processing audio...');

            try {
                const transcription = await groq.audio.transcriptions.create({
                    file: fs.createReadStream(tempFile),
                    model: 'whisper-large-v3',
                    language: 'es'
                });

                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

                resolve(transcription.text);
            } catch (error) {
                console.error('Transcription error:', error.message);
                resolve('');
            }
        }, 6000);

        micInputStream.on('error', (err) => {
            console.error('Microphone error:', err.message);
            micInstance.stop();
            resolve('');
        });
    });
}
