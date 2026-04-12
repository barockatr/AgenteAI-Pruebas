/**
 * retry.js — Resilient API Call Wrapper
 * Single Responsibility: Retry logic with exponential backoff for transient API errors.
 */

/**
 * Wraps an async function with automatic retry and exponential backoff.
 * Only retries on transient/rate-limit HTTP errors (429, 413, 500, 502, 503).
 * @param {Function} fn - Async function to execute.
 * @param {Object} [options] - Configuration options.
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts.
 * @param {number} [options.baseDelay=1000] - Base delay in ms (doubles each retry).
 * @returns {Promise<*>} - Result of the wrapped function.
 */
export async function withRetry(fn, { maxRetries = 3, baseDelay = 1000 } = {}) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const status = error?.status || error?.statusCode;
            const isRetryable = [429, 413, 500, 502, 503].includes(status);

            if (!isRetryable || attempt === maxRetries) {
                throw error;
            }

            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.warn(`⏳ API error ${status}. Retry ${attempt}/${maxRetries} in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}
