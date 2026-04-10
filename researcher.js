/**
 * researcher.js — Web Research Module
 * Single Responsibility: Execute external technical searches via Tavily.
 */
import { tavily } from '@tavily/core';
import { speak } from './speaker.js';

// Initialize Tavily client with environment key
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

/**
 * Performs a technical web search.
 * @param {string} query - The query to investigate.
 * @returns {Promise<string>} - Formatted results summary.
 */
export async function webSearch(query) {
    // Visual feedback in console
    console.log(`\n🌐 [Web Investigator] Consulting external sources for: "${query}"...\n`);

    try {
        const response = await tvly.search(query, {
            searchDepth: 'advanced',
            maxResults: 5,
            includeAnswer: true,
            topic: 'general',
        });

        // Build results summary
        const answer = response.answer
            ? `📋 Direct answer:\n${response.answer}\n`
            : '';

        const sources = response.results
            .map((r, i) => `${i + 1}. [${r.title}](${r.url})\n   ${r.content?.slice(0, 200)}...`)
            .join('\n\n');

        const summary = `${answer}\n🔗 Consulted sources:\n${sources}`;

        // Audio feedback on completion
        await speak('Web search completed. I have verified the information online.');

        return summary;
    } catch (error) {
        const errMsg = `Web search error: ${error.message}`;
        console.error(`❌ [Web Investigator] ${errMsg}`);
        return errMsg;
    }
}
