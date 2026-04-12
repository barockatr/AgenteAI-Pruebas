# 🤖 AI Agent — Autonomous DevSecOps Assistant

![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Groq Engine](https://img.shields.io/badge/Groq-Powered-orange?style=for-the-badge&logo=groq)
![Tavily Connected](https://img.shields.io/badge/Tavily-Investigator-purple?style=for-the-badge)
![Voice-Enabled](https://img.shields.io/badge/Voice_TTS-Enabled-ff69b4?style=for-the-badge&logo=audio)

> _A hybrid engineering assistant that doesn't just chat — it monitors your code in real-time, performs autonomous technical research, and acts as a proactive security sentinel across your entire workstation._

---

## ✨ Core Features

*   🛡️ **Shield Guard (Sentinel):** Proactive file system monitoring powered by **[Chokidar](https://github.com/paulmillr/chokidar)** — the industry-standard file watcher for Node.js. Detects changes in your documents (`.js`, `.css`, etc.) and executes an instant security and architecture audit using the 70B model, entirely in the background.
*   🧠 **Smart Orchestrator:** Intelligent model routing. Relies on **Llama-3.1-8B-Instant** for ultra-low latency conversational interactions, automatically scaling to **Llama-3.3-70B-Versatile** for deep reasoning, heavy code reviews, or crucial architectural decisions.
*   🌐 **Web Investigator:** Connected in real-time with the **Tavily API**. The assistant autonomously invokes internet searches the moment it detects a prompt regarding new libraries, unknown errors, or when it requires external documentation outside its local knowledge base.
*   🗣️ **Voice of Authority:** Advanced TTS (Text-to-Speech) system that proactively reports findings from the Sentinel or confirms when web investigations are complete. Forget visual fatigue; let the assistant notify you audibly.

---

## ⚙️ Prerequisites & Initial Setup

Follow these steps to deploy the assistant engine on your local machine.

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/barockatr/AgenteAI-Pruebas.git
cd AgenteIA-Pruebas
npm install
```

### 2. System-Level Dependencies (Audio Pipeline)

For the **Voice of Authority** module to function correctly, the host OS must expose audio playback capabilities:

| Platform        | Action Required                                                         |
|:----------------|:------------------------------------------------------------------------|
| **Windows**     | Native support — no extra packages needed (leveraged by `say` module).  |
| **WSL / Linux** | Install `mpg123`: `sudo apt install mpg123`                             |
| **macOS**       | Native support via `say` binary — pre-installed.                        |

### 3. Environment Injection

Create a `.env` file at the project root and inject your API tokens:

```env
GROQ_API_KEY=your_groq_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

> [!IMPORTANT]
> **Never commit your `.env` file to version control.** The `.gitignore` is pre-configured to exclude it, but always verify before pushing.

---

## 🌍 Installation as a Global Service (Recommended)

> _This is the definitive deployment strategy. The goal is to transform the agent from a project-bound script into a **system-wide service** — a persistent, location-agnostic command available from any terminal session, in any directory, at any time._

### The Philosophy: The Omnipresent Brain 🧠

When installed as a global service, the agent stops being "a tool inside a folder" and evolves into a **system-level cognitive layer**. The key architectural benefit:

> **The agent acts as an Omnipresent Brain — it monitors and operates on whatever project is currently active in your terminal's working directory, without requiring per-project configurations, local installations, or repetitive setup rituals.**

You open a terminal in `~/projects/my-api`, type `agente`, and the Sentinel immediately begins watching that directory. You switch to `~/projects/my-frontend`, type `agente` again, and it seamlessly adapts. **Zero friction. Zero configuration drift. One brain, infinite workspaces.**

---

### Step 1: Register the Global Binary via npm link

From within the cloned project directory, register the `agente` command globally:

```bash
cd C:\Users\INTEL\Desktop\AgenteIA-Pruebas
npm link
```

This creates a global symlink from your system's Node.js `bin` directory to `chat.js`, making the `agente` command available system-wide. Verify it:

```bash
agente --help
# or simply:
where agente
```

> [!NOTE]
> `npm link` leverages the `"bin"` field in `package.json` (`"agente": "./chat.js"`) and the `#!/usr/bin/env node` shebang in `chat.js` to register a first-class CLI command.

---

### Step 2: Create the One-Click Launcher (`.bat` — Windows)

For scenarios where you prefer a double-click desktop shortcut or integration with task schedulers, create a Windows batch launcher. **No IDE required — a simple text editor is all you need.**

#### How to Create It (Step by Step)

1. Open **Notepad** (`Win + R` → type `notepad` → Enter).
2. Paste the following code exactly as shown:

```bat
@echo off
title MOTOR AGENTE IA - VIGILANTE
cd /d "C:\Users\INTEL\Desktop\AgenteIA-Pruebas"
echo 📡 Iniciando el Cerebro del Agente (Client Mode)...
node client.js
pause
```

3. Go to **File → Save As...**
4. In the **"Save as type"** dropdown, select **All Files (`*.*`)**.
5. Name the file `agente.bat` (the `.bat` extension is critical — without it, Windows treats it as plain text).
6. Save it to your **Desktop** or any convenient location.

> [!WARNING]
> If you save with the default "Text Documents (*.txt)" type, the file will be named `agente.bat.txt` and **will not execute**. Always select **All Files** before saving.

#### What Each Line Does

| Line | Purpose |
|:-----|:--------|
| `@echo off` | Suppresses command echoing for a clean output. |
| `title MOTOR AGENTE IA - VIGILANTE` | Sets the terminal window title for quick identification. |
| `cd /d "C:\Users\INTEL\Desktop\AgenteIA-Pruebas"` | Forces navigation to the project directory (`/d` enables cross-drive switching). |
| `echo 📡 Iniciando...` | Visual confirmation that the engine is booting. |
| `node client.js` | Spawns the AI Agent's client entry point via Node.js. |
| `pause` | Keeps the terminal open after exit so you can review any output or errors. |

#### Deployment Options

1. **Desktop Shortcut:** Double-click `agente.bat` on your Desktop to launch instantly.
2. **System PATH:** Place `agente.bat` in a directory on your `PATH` (e.g., `C:\tools\`) to invoke it from any terminal with just `agente`.
3. **Pinned to Taskbar:** Right-click the `.bat` → **Create shortcut** → drag to taskbar for one-click access.

> [!TIP]
> To launch the agent in a **specific project directory** via the shortcut, right-click the `.bat` shortcut → Properties → set the **"Start in"** field to the desired project path.

---

### Step 3: Configure the PowerShell Alias (Universal Terminal Access)

For permanent, shell-native access from any PowerShell session, register a persistent alias in your PowerShell profile:

```powershell
# Open your PowerShell profile for editing
notepad $PROFILE
```

Append the following function and alias at the end of the file:

```powershell
# ── AI Agent: Global Alias ──────────────────────────────────
# Launches the Autonomous DevSecOps Assistant from any location.
# The Sentinel auto-attaches to the current working directory.
function Start-AIAgent {
    node "C:\Users\INTEL\Desktop\AgenteIA-Pruebas\chat.js"
}
Set-Alias -Name agente -Value Start-AIAgent
# ─────────────────────────────────────────────────────────────
```

Save, close, and reload your profile:

```powershell
. $PROFILE
```

**Verification — from any directory on your system:**

```powershell
cd C:\Users\INTEL\Documents\any-project
agente
# ✅ The Sentinel is now watching THIS directory. Brain engaged.
```

> [!CAUTION]
> If PowerShell throws an `ExecutionPolicy` error when loading the profile, run the following **once** as Administrator:
> ```powershell
> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

---

## 🎮 Usage

Start the intelligent bridge by running:

```bash
npm start
# or direct entry point:
node chat.js
# or global binary (recommended):
agente
```

### Interaction Commands

Once interacting with the **Orchestrator**, you operate on a dual-channel console (General Chat + Meta Commands):

| Command    | Action                                                                                             |
|:-----------|:--------------------------------------------------------------------------------------------------|
| _(prompt)_ | Type freely and press `Enter`. The Web Investigator handles background searches autonomously.     |
| `/voice`   | Activates ambient microphone listening with real-time speech-to-text transcoding (Listener).       |
| `/usage`   | Displays **accumulated token consumption** for the active session — essential for cost governance. |
| `/clear`   | Purges the memory stack to prevent context contamination across long conversational flows.         |
| `exit`     | Gracefully stops the Orchestrator and disconnects the Sentinel watchdog.                          |

---

## 🏗️ Architecture

The core of the framework is fully migrated to the modern **ESM (ECMAScript Modules)** standard. The entire pipeline — from conversational I/O to the reactive file monitoring of the Sentinel — is built on a pure **Async/Non-blocking** paradigm. This guarantees the Node.js Event Loop never experiences prolonged blocking or bottlenecks from remote AI API calls.

### Module Topology

```
AgenteIA-Pruebas/
├── chat.js            # 🧠 Orchestrator REPL — Entry point & tool dispatcher
├── client.js          # 🔌 Groq SDK client initialization
├── tools.js           # 🛠️  Tool definitions & file system operations
├── watchdog.js        # 🛡️ Sentinel — chokidar-based file watcher
├── researcher.js      # 🌐 Tavily web search integration
├── speaker.js         # 🗣️ TTS voice output engine
├── listener.js        # 🎤 Microphone input & speech-to-text
├── logger.js          # 📝 Structured action logging
├── service.js         # ⚡ Lightweight service entry point
└── ARCHITECTURE.md    # 📐 Auto-updated architecture decision log
```

### 🧬 Self-Healing & Resiliency

This project exhibits the robustness required to adapt to the fast-paced LLM ecosystem. It features configuration elasticity to iterate seamlessly from deprecated model versions to bleeding-edge releases (e.g., `Llama 3 → Llama 3.1 → Llama 3.3`). Centralizing context variables ensures that model upgrades are executed as **micro-patches with zero operational downtime**.

---

## 📄 License

MIT © 2026 — Built with engineering discipline and relentless iteration.
