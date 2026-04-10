const fs = require('fs');
const path = require('path');

const PROTECTED_FILES = ['.env', 'package.json', 'package-lock.json'];

/**
 * Valida si un archivo está en la lista negra de seguridad.
 * @param {string} filePath - Ruta del archivo.
 * @returns {boolean} True si está protegido.
 */
function isBlacklisted(filePath) {
    const fileName = path.basename(filePath);
    const isGit = filePath.includes('.git');
    const isEnv = fileName === '.env';
    return PROTECTED_FILES.includes(fileName) || isGit || isEnv;
}

/**
 * Lee el contenido de un archivo del proyecto de forma segura.
 */
function readFileContent(filePath) {
    try {
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        
        // Verificación de Path Traversal
        if (!absolutePath.startsWith(process.cwd())) {
            return 'Acceso denegado: No puedes leer archivos fuera del proyecto.';
        }

        if (!fs.existsSync(absolutePath)) {
            return `Error: El archivo "${filePath}" no existe.`;
        }

        return fs.readFileSync(absolutePath, 'utf8');
    } catch (error) {
        return `Error al leer archivo: ${error.message}`;
    }
}

/**
 * Crea o actualiza un archivo de forma segura.
 * @param {string} filePath - Ruta del archivo.
 * @param {string} content - Contenido a escribir.
 * @returns {string} Mensaje de éxito o error.
 */
function createOrUpdateFile(filePath, content) {
    try {
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

        // 1. Protección contra Path Traversal
        if (!absolutePath.startsWith(process.cwd())) {
            return 'Acceso denegado: No puedes escribir archivos fuera del directorio del proyecto.';
        }

        // 2. Verificación de Blacklist
        if (isBlacklisted(absolutePath)) {
            return `Acceso denegado: el archivo "${path.basename(absolutePath)}" es crítico para el sistema.`;
        }

        // 3. Escritura
        fs.writeFileSync(absolutePath, content, 'utf8');
        return `Éxito: Archivo "${filePath}" guardado correctamente.`;

    } catch (error) {
        console.error(`Error al escribir el archivo ${filePath}:`, error.message);
        return `Error al escribir archivo: ${error.message}`;
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
            description: "Lee el contenido de un archivo específico del proyecto.",
            parameters: {
                type: "object",
                properties: {
                    filePath: { type: "string", description: "Ruta del archivo (ej: 'client.js')." }
                },
                required: ["filePath"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "createOrUpdateFile",
            description: "Crea un nuevo archivo o actualiza uno existente con el contenido proporcionado.",
            parameters: {
                type: "object",
                properties: {
                    filePath: { type: "string", description: "Ruta o nombre del archivo (ej: 'README.md')." },
                    content: { type: "string", description: "El contenido completo que se escribirá en el archivo." }
                },
                required: ["filePath", "content"]
            }
        }
    }
];

module.exports = {
    readFileContent,
    createOrUpdateFile,
    toolsDefinition
};
