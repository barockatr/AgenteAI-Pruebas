import { readFile, writeFile, readdir, stat, appendFile } from 'fs/promises';
import { join, basename, isAbsolute } from 'path';
import { existsSync } from 'fs';

const PROTECTED_FILES = ['.env', 'package.json', 'package-lock.json'];
const IGNORE_LIST = ['node_modules', '.git', 'package-lock.json', 'agent.log'];

/**
 * VALIDATION LOGIC (SRP)
 */
const security = {
    isBlacklisted(filePath) {
        const fileName = basename(filePath);
        return PROTECTED_FILES.includes(fileName) || filePath.includes('.git') || fileName === '.env';
    },
    validatePath(filePath) {
        const absolutePath = isAbsolute(filePath) ? filePath : join(process.cwd(), filePath);
        if (!absolutePath.startsWith(process.cwd())) {
            throw new Error('Access denied: Outside project directory.');
        }
        return absolutePath;
    }
};

/**
 * FILE TOOLS (Async / ESM)
 */
export async function readFileContent(filePath) {
    try {
        const absolutePath = security.validatePath(filePath);
        if (!existsSync(absolutePath)) return `Error: The file "${filePath}" does not exist.`;
        return await readFile(absolutePath, 'utf8');
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

export async function createOrUpdateFile(filePath, content) {
    try {
        const absolutePath = security.validatePath(filePath);
        if (security.isBlacklisted(absolutePath)) {
            return `Access denied: "${basename(absolutePath)}" is a protected file.`;
        }
        await writeFile(absolutePath, content, 'utf8');
        return `Success: File "${filePath}" saved.`;
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
        return `Error listing: ${error.message}`;
    }
}

/**
 * NEW TOOL: ARCHITECTURE DOCUMENTATION
 */
export async function updateArchitectureDocs(issue, fix) {
    try {
        const archFile = join(process.cwd(), 'ARCHITECTURE.md');
        const timestamp = new Date().toISOString().split('T')[0];
        
        let header = '';
        if (!existsSync(archFile)) {
            header = '# Architecture and Technical Decisions Log\n\nThis file logs critical findings detected by the Senior Architect.\n\n| Date | Finding / Issue | Solution / Improvement | Severity |\n|------|-----------------|------------------------|----------|\n';
        }

        const entry = `| ${timestamp} | ${issue} | ${fix} | ALTA |\n`;
        await appendFile(archFile, header + entry, 'utf8');
        
        return `Success: ARCHITECTURE.md updated with finding: "${issue}"`;
    } catch (error) {
        return `Error updating documentation: ${error.message}`;
    }
}

/**
 * TOOLS DEFINITION (JSON Schema)
 */
export const toolsDefinition = [
    {
        type: "function",
        function: {
            name: "readFileContent",
            description: "Reads the content of a file (Async).",
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
            description: "Writes content to a file (Async).",
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
            description: "Hierarchical project map (Async).",
            parameters: { type: "object", properties: {} }
        }
    },
    {
        type: "function",
        function: {
            name: "auditFile",
            description: "Deep security and quality audit.",
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
            description: "Logs important technical findings in ARCHITECTURE.md.",
            parameters: {
                type: "object",
                properties: {
                    issue: { type: "string", description: "The detected issue." },
                    fix: { type: "string", description: "The applied or proposed solution." }
                },
                required: ["issue", "fix"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "webSearch",
            description: "Performs a technical web search. Use it to search for new technologies, versions, documentation, or recent news.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "The query to search on the web." }
                },
                required: ["query"]
            }
        }
    }
];
