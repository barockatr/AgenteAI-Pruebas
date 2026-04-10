# 🤖 Agente IA Autónomo - Arquitectura Senior

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Groq](https://img.shields.io/badge/Inference-Groq_Cloud-orange.svg)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Style](https://img.shields.io/badge/Code_Style-Senior_Architect-purple.svg)](#)

Un agente de IA autónomo diseñado para la gestión, auditoría y desarrollo proactivo de software. Construido sobre una arquitectura **Híbrida de Modelos** y un sistema de **Vigilancia Reactiva**.

---

## 🏛️ Arquitectura del Sistema

El agente utiliza una estructura modular basada en **ES Modules (ESM)** y asincronismo total para garantizar una ejecución no bloqueante.

### 🧠 El Estratega (Model Router)
Optimización inteligente de inferencia:
- **Diálogo REPL**: Impulsado por `llama3-8b` para respuestas instantáneas y bajo consumo.
- **Arquitecto / Código**: Intervención de `llama3-70b` para razonamiento profundo y generación de código de alta fidelidad.

### 🛡️ El Guardián (Watchdog)
Sistema de vigilancia en tiempo real alimentado por `chokidar`.
- Monitoriza cambios en archivos `.js` y `.css`.
- Ejecuta **Auditorías Silenciosas** al detectar un guardado.
- Interrumpe mediante **Voz de Autoridad** si detecta vulnerabilidades críticas o riesgos de seguridad.

### 🔊 Interfaz de Voz de Autoridad
Salida de audio integrada que proporciona feedback auditivo sobre:
- Hallazgos de seguridad.
- Resúmenes de auditoría arquitectónica.
- Confirmaciones de estado del sistema.

---

## 🚀 Capacidades Destacadas

- **Auditoría Autónoma**: Detección de XSS, cuellos de botella y violaciones de Clean Code.
- **Documentación Viva**: Mantenimiento automático de `ARCHITECTURE.md` con hallazgos históricos.
- **Modo Híbrido**: Entrada/Salida dual entre Texto (REPL) y Voz (Whisper + TTS).
- **Seguridad Blindada**: Blacklist de archivos críticos y protección contra Path Traversal.

---

## 🛠️ Instalación y Uso

### Requisitos
- Node.js v18 o superior.
- Una API Key de [Groq Cloud](https://console.groq.com/).

### Configuración
1. Clona el repositorio.
2. Crea un archivo `.env` en la raíz:
   ```env
   GROQ_API_KEY=tu_clave_aqui
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```

### Ejecución
Puedes iniciar el agente globalmente (si se instaló) o mediante:
```bash
node chat.js
```

### Comandos REPL
- `/voice`: Activa la escucha activa (6 segundos).
- `/clear`: Limpia la memoria de la sesión.
- `/usage`: Muestra el consumo acumulado de tokens.
- `salir` o `exit`: Cierra la sesión.

---

## 📜 Reglas de ADN (Architect Brain)
- **ESM Obligatorio**: Uso estricto de `import/export`.
- **Async First**: Prohibición de métodos `sync` que bloqueen el event loop.
- **No var**: Uso exclusivo de `const` y `let`.
- **Clean Code**: Fomento del Principio de Responsabilidad Única.

---

## ⚖️ Licencia
Este proyecto está bajo la licencia MIT. Siéntete libre de colaborar y evolucionar este "Cerebro Digital".

---
*Construido con ❤️ por un Agente IA y su Senior Architect.*
