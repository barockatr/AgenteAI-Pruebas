const fs = require('fs');
const path = require('path');

const PROTECTED_FILES = ['.env', 'package.json', 'package-lock.json'];
const IGNORE_LIST = ['node_modules', '.git', 'package-lock.json', 'agent.log'];

/**
 * Valida si un archivo está en la lista negra de seguridad.
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
 */
function createOrUpdateFile(filePath, content) {
    try {
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

        if (!absolutePath.startsWith(process.cwd())) {
            return 'Acceso denegado: No puedes escribir archivos fuera del directorio del proyecto.';
        }

        if (isBlacklisted(absolutePath)) {
            return `Acceso denegado: el archivo "${path.basename(absolutePath)}" es crítico para el sistema.`;
        }

        fs.writeFileSync(absolutePath, content, 'utf8');
        return `Éxito: Archivo "${filePath}" guardado correctamente.`;

    } catch (error) {
        return `Error al escribir archivo: ${error.message}`;
    }
}

/**
 * Genera una vista de árbol recursiva del proyecto.
 * @param {string} dir - Directorio a escanear.
 * @param {string} indent - Indentación para la vista jerárquica.
 * @returns {string} El mapa del proyecto en formato de árbol.
 */
function listDirectoryRecursive(dir = process.cwd(), indent = '') {
    let results = '';
    const files = fs.readdirSync(dir);

    files.forEach((file, index) => {
        if (IGNORE_LIST.includes(file)) return;

        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const isLast = index === files.length - 1;
        const prefix = indent + (isLast ? '└── ' : '├── ');

        results += `${prefix}${file}\n`;

        if (stats.isDirectory()) {
            results += listDirectoryRecursive(filePath, indent + (isLast ? '    ' : '│   '));
        }
    });

    return results;
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
                    filePath: { type: "string", description: "Ruta del archivo." }
                },
                required: ["filePath"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "createOrUpdateFile",
            description: "Crea o actualiza un archivo con contenido específico.",
            parameters: {
                type: "object",
                properties: {
                    filePath: { type: "string", description: "Ruta del archivo." },
                    content: { type: "string", description: "Contenido del archivo." }
                },
                required: ["filePath", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "listDirectoryRecursive",
            description: "Genera una vista jerárquica completa de todos los archivos y carpetas del proyecto.",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    }
];

module.exports = {
    readFileContent,
    createOrUpdateFile,
    listDirectoryRecursive, // Exportamos la nueva función
    toolsDefinition
};
