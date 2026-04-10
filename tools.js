const fs = require('fs');
const path = require('path');

/**
 * Lee el contenido de un archivo del proyecto de forma segura.
 * @param {string} filePath - La ruta o nombre del archivo a leer.
 * @returns {string} El contenido del archivo o un mensaje de error.
 */
function readFileContent(filePath) {
    try {
        // Validación básica de seguridad
        if (typeof filePath !== 'string') {
            throw new Error('La ruta debe ser una cadena de texto.');
        }

        // Resolución de la ruta absoluta para evitar accesos fuera del proyecto
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        
        if (!fs.existsSync(absolutePath)) {
            return `Error: El archivo "${filePath}" no existe.`;
        }

        const stats = fs.statSync(absolutePath);
        if (stats.isDirectory()) {
            return `Error: "${filePath}" es un directorio, no un archivo.`;
        }

        return fs.readFileSync(absolutePath, 'utf8');

    } catch (error) {
        console.error(`Error al leer el archivo ${filePath}:`, error.message);
        return `Error al leer archivo: ${error.message}`;
    }
}

/**
 * Definición de herramientas siguiendo el JSON Schema de OpenAI/Groq.
 */
const toolsDefinition = [
    {
        type: "function",
        function: {
            name: "readFileContent",
            description: "Lee el contenido de un archivo específico del proyecto para analizar su código.",
            parameters: {
                type: "object",
                properties: {
                    filePath: {
                        type: "string",
                        description: "La ruta relativa o nombre del archivo a leer (ej: 'client.js')."
                    }
                },
                required: ["filePath"]
            }
        }
    }
];

module.exports = {
    readFileContent,
    toolsDefinition
};
