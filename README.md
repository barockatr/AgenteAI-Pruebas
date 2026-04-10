# 🤖 AI Agent - Autonomous DevSecOps Assistant

![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Groq Engine](https://img.shields.io/badge/Groq-Powered-orange?style=for-the-badge&logo=groq)
![Tavily Connected](https://img.shields.io/badge/Tavily-Investigator-purple?style=for-the-badge)
![Voice-Enabled](https://img.shields.io/badge/Voice_TTS-Enabled-ff69b4?style=for-the-badge&logo=audio)

> _A hybrid assistant that doesn't just chat, but monitors your code in real-time and performs autonomous technical research._

---

## ✨ Core Features

*   🛡️ **Shield Guard (Sentinel):** Proactive file system monitoring. Detects changes in your documents (`.js`, `.css`, etc.) and executes an instant security and architecture audit using the 70B model, entirely in the background.
*   🧠 **Smart Orchestrator:** Intelligent model routing. Relies on **Llama-3.1-8B-Instant** for ultra-low latency conversational interactions, automatically scaling to **Llama-3.3-70B-Versatile** for deep reasoning, heavy code reviews, or crucial architectural decisions.
*   🌐 **Web Investigator:** Connected in real-time with the **Tavily API**. The assistant autonomously invokes internet searches the moment it detects a prompt regarding new libraries, unknown errors, or when it requires external documentation outside its local knowledge base.
*   🗣️ **Voice of Authority:** Advanced TTS (Text-to-Speech) system that proactively reports findings from the Sentinel or confirms when web investigations are complete. Forget visual fatigue; let the assistant notify you audibly.

---

## ⚙️ Setup & Installation

Follow these steps to run the assistant locally on your machine.

1. **Clone the repository** and install Node.js dependencies:
   ```bash
   git clone <https://github.com/barockatr/AgenteAI-Pruebas.git>
   cd AgenteIA-Pruebas
   npm install
   ```

2. **System Dependencies Installation:**  
   For the **Voice of Authority** module to work properly, it's imperative to have audio players installed at the system level so they can be orchestrated by Node.js.  
   *   *(Recommended on Windows)*: Ensure you have native tools ready (usually out-of-the-box for libraries like `say`).
   *   *(On WSL/Linux Unix)*: Install packages like `mpg123` (`sudo apt install mpg123`).

3. **Environment Setup:**
   Create or adjust the `.env` file in your project root and inject your tokens:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here
   ```

---

## 🎮 Usage

Start the intelligent bridge by running:
```bash
npm start
# or
node chat.js
# or custom CLI binary command
agente
```

### Interaction Commands
Once interacting with the **Orchestrator**, you have a dual console (General Chat + Meta Commands):

*   Provide your prompt freely and press `Enter`. If web searches are required, the investigator will handle them in the background.
*   `/voice`: Activates ambient listening with your microphone and transcodes to text (Listener).
*   `/clear`: Purges and resets the memory stack to prevent mixing long context flows.
*   `exit` / `salir`: Stops the orchestrator and cleanly disconnects the Sentinel watchdog.

### 📊 Token Awareness
*   `/usage`: This special command allows you to monitor the **accumulated token consumption** during your session. A vital tool for _cost-aware_ programmers in production environments, providing full visibility over API expenditure.

---

## 🏗️ Architecture Section

The core of the framework is entirely migrated to the modern **ESM (ECMAScript Modules)** standard. The entire pipeline—from conversational I/O to the reactive file monitoring of the Sentinel—is built to operate purely on an **Async/Non-blocking** paradigm. This guarantees the Node Event Loop never experiences prolonged blocking or bottlenecks from remote AI API calls.

### 🧬 Self-Healing Note (Resiliency)
This project exhibits robustness to adapt to the fast-paced tech ecosystem. It features configuration elasticity to iterate from deprecated LLMs to bleeding-edge versions (e.g. Llama 3 -> Llama 3.1 / 3.3). Centralizing context variables ensures that model upgrades are executed as micro patches with zero operational downtime.
