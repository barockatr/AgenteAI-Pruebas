import fs from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { pipeline } from '@xenova/transformers';

const MEMORY_FILE = join(process.cwd(), 'vector_store.json');

/**
 * Función auxiliar para calcular la similitud del Coseno entre dos vectores.
 */
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

class LongTermMemory {
    constructor() {
        this.extractor = null;
        this.vectors = [];
        this.initialized = false;
    }

    /**
     * Inicializa el modelo y carga los vectores guardados.
     */
    async init() {
        if (this.initialized) return;
        try {
            console.log('🧠 [Memory] Cargando modelo de embeddings (all-MiniLM-L6-v2) localmente...');
            // Configuramos pipeline local para Feature Extraction (Embeddings)
            this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                quantized: true // Reduce el tamaño a coste ligero de precisión
            });
            await this.loadMemory();
            this.initialized = true;
            console.log('✅ [Memory] RAG listo. Memorias cargadas:', this.vectors.length);
        } catch (error) {
            console.error('❌ [Memory] Error inicializando RAG Local:', error.message);
        }
    }

    /**
     * Carga el estado anterior desde disk.
     */
    async loadMemory() {
        if (existsSync(MEMORY_FILE)) {
            const data = await fs.readFile(MEMORY_FILE, 'utf8');
            try {
                this.vectors = JSON.parse(data);
            } catch (e) {
                this.vectors = [];
            }
        }
    }

    /**
     * Guarda el estado actual al disk.
     */
    async saveMemory() {
        await fs.writeFile(MEMORY_FILE, JSON.stringify(this.vectors, null, 2), 'utf8');
    }

    /**
     * Inserta un nuevo recuerdo. 
     * Cumple el requerimiento de Metadata (text, embedding, timestamp, file_context).
     * @param {string} text - El contenido a recordar
     * @param {string} fileContext - Fichero o contexto de la acción
     */
    async addMemory(text, fileContext = 'General') {
        if (!this.initialized || !text.trim()) return;
        try {
            const output = await this.extractor(text, { pooling: 'mean', normalize: true });
            const embedding = Array.from(output.data);
            
            const memory = {
                text,
                embedding,
                timestamp: new Date().toISOString(),
                file_context: fileContext
            };

            this.vectors.push(memory);
            await this.saveMemory();
        } catch (error) {
            console.error('❌ [Memory] Falla agregando recuerdo:', error.message);
        }
    }

    /**
     * Busca los recuerdos más similares.
     * @param {string} query - Lo que se desea consultar al pasado.
     * @param {number} topK - Límite de recuerdos a regresar.
     * @returns {Promise<Array>}
     */
    async searchSimilar(query, topK = 3) {
        if (!this.initialized || this.vectors.length === 0 || !query.trim()) return [];
        try {
            const output = await this.extractor(query, { pooling: 'mean', normalize: true });
            const queryVector = Array.from(output.data);

            const scored = this.vectors.map(mem => ({
                ...mem,
                score: cosineSimilarity(queryVector, mem.embedding)
            }));

            // Ordenamos por mayor similitud
            scored.sort((a, b) => b.score - a.score);

            // Devolvemos el topK filtrando similitudes muy bajas
            return scored.filter(s => s.score > 0.3).slice(0, topK);
        } catch (error) {
            console.error('❌ [Memory] Falla en búsqueda:', error.message);
            return [];
        }
    }
}

export const memoryStore = new LongTermMemory();