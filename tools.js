import { readFile, writeFile, readdir, stat, appendFile } from 'fs/promises';
import { join, basename, isAbsolute } from 'path';
import { existsSync } from 'fs';

const PROTECTED_FILES = ['.env', 'package.json', 'package-lock.json'];
const IGNORE_LIST = ['node_modules', '.git', 'package-lock.json', 'agent.log'];

/**
 * LÓGICA DE VALIDACIÓN (SRP)
 */
const security = {
    isBlacklisted(filePath) {
        const fileName = basename(filePath);
        return PROTECTED_FILES.includes(fileName) || filePath.includes('.git') || fileName === '.env';
    },
    validatePath(filePath) {
        const absolutePath = isAbsolute(filePath) ? filePath : join(process.cwd(), filePath);
        if (!absolutePath.startsWith(process.cwd())) {
            throw new Error('Acceso denegado: Fuera del directorio del proyecto.');
        }
        return absolutePath;
    }
};

/**
 * HERRAMIENTAS DE ARCHIVOS (Async / ESM)
 */
export async function readFileContent(filePath) {
    try {
        const absolutePath = security.validatePath(filePath);
        if (!existsSync(absolutePath)) return `Error: El archivo "${filePath}" no existe.`;
        return await readFile(absolutePath, 'utf8');
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

export async function createOrUpdateFile(filePath, content) {
    try {
        const absolutePath = security.validatePath(filePath);
        if (security.isBlacklisted(absolutePath)) {
            return `Acceso denegado: "${basename(absolutePath)}" es un archivo protegido.`;
        }
        await writeFile(absolutePath, content, 'utf8');
        return `Éxito: Archivo "${filePath}" guardado.`;
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

export async function listDirectoryRecursive(dir = process.cwd(), indent = '') {
    try {
        let results = '';
        const files = await readdir(dir);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (IGNORE_LIST.includes(file)) continue;

            const filePath = join(dir, file);
            const fileStats = await stat(filePath);
            const isLast = i === files.length - 1;
            const prefix = indent + (isLast ? '└── ' : '├── ');

            results += `${prefix}${file}\n`;

            if (fileStats.isDirectory()) {
                results += await listDirectoryRecursive(filePath, indent + (isLast ? '    ' : '│   '));
            }
        }
        return results;
    } catch (error) {
        return `Error al listar: ${error.message}`;
    }
}

/**
 * NUEVA HERRAMIENTA: DOCUMENTACIÓN ARQUITECTÓNICA
 */
export async function updateArchitectureDocs(issue, fix) {
    try {
        const archFile = join(process.cwd(), 'ARCHITECTURE.md');
        const timestamp = new Date().toISOString().split('T')[0];
        
        let header = '';
        if (!existsSync(archFile)) {
            header = '# Registro de Arquitectura y Decisiones Técnicas\n\nEste archivo registra hallazgos críticos detectados por el Arquitecto Senior.\n\n| Fecha | Hallazgo / Issue | Solución / Mejora | Severidad |\n|-------|------------------|-------------------|-----------|\n';
        }

        const entry = `| ${timestamp} | ${issue} | ${fix} | ALTA |\n`;
        await appendFile(archFile, header + entry, 'utf8');
        
        return `Éxito: ARCHITECTURE.md actualizado con el hallazgo: "${issue}"`;
    } catch (error) {
        return `Error al actualizar documentación: ${error.message}`;
    }
}

/**
 * DEFINICIÓN DE HERRAMIENTAS (JSON Schema)
 */
export const toolsDefinition = [
    {
        type: "function",
        function: {
            name: "readFileContent",
            description: "Lee el contenido de un archivo (Async).",
            parameters: {
                type: "object",
                properties: { filePath: { type: "string" } },
                required: ["filePath"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "createOrUpdateFile",
            description: "Escribe contenido en un archivo (Async).",
            parameters: {
                type: "object",
                properties: { 
                    filePath: { type: "string" },
                    content: { type: "string" }
                },
                required: ["filePath", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "listDirectoryRecursive",
            description: "Mapa jerárquico del proyecto (Async).",
            parameters: { type: "object", properties: {} }
        }
    },
    {
        type: "function",
        function: {
            name: "auditFile",
            description: "Auditoría profunda de seguridad y calidad.",
            parameters: {
                type: "object",
                properties: { filePath: { type: "string" } },
                required: ["filePath"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "updateArchitectureDocs",
            description: "Registra hallazgos técnicos importantes en ARCHITECTURE.md.",
            parameters: {
                type: "object",
                properties: {
                    issue: { type: "string", description: "El problema detectado." },
                    fix: { type: "string", description: "La solución aplicada o propuesta." }
                },
                required: ["issue", "fix"]
            }
        }
    }
];
