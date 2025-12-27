/**
 * Variable substitution helper
 * Replaces {{key}} with values from the variables map
 */

/**
 * Replace all occurrences of {{key}} in the text with value from variables map
 * @param {string} text - The text to process
 * @param {Object} variables - Key-value map of variables
 * @returns {string} - Text with variables substituted
 */
export function substitute(text, variables) {
    if (!text || typeof text !== 'string') return text
    if (!variables || Object.keys(variables).length === 0) return text

    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const trimmedKey = key.trim()
        if (variables.hasOwnProperty(trimmedKey)) {
            return variables[trimmedKey]
        }
        return match // Return original if variable not found
    })
}

/**
 * Parse variables JSON string safely
 * @param {string} jsonString - JSON string of variables
 * @returns {Object} - Parsed variables map
 */
export function parseVariables(jsonString) {
    try {
        return JSON.parse(jsonString || '{}')
    } catch (e) {
        console.error('Failed to parse variables:', e)
        return {}
    }
}
