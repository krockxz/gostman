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
    let parsed
    try {
        parsed = JSON.parse(jsonString || '{}')
    } catch (e) {
        console.error('Failed to parse variables:', e)
        return {}
    }
    const result = {}
    for (const key of Object.keys(parsed)) {
        const value = parsed[key]
        // null/undefined values are treated as missing so the placeholder
        // is left unchanged (matches Go's nil-skip behavior).
        if (value == null) {
            continue
        }
        result[key] = typeof value === 'string' ? value : String(value)
    }
    return result
}
