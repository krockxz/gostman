/**
 * Sends a request via the Vercel serverless proxy to avoid CORS issues.
 * @param {Object} requestData - The request details.
 * @param {string} requestData.method - HTTP method (GET, POST, etc.)
 * @param {string} requestData.url - The target URL.
 * @param {Object} requestData.headers - Request headers.
 * @param {string} requestData.body - Request body.
 * @returns {Promise<Response>} The fetch response.
 */
export async function sendProxyRequest({ method, url, headers, body }) {
    return fetch('/api/proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            method,
            url,
            headers,
            body,
        }),
    })
}
