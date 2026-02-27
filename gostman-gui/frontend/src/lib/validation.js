/**
 * JSON Validation Utilities
 * Provides detailed error reporting for JSON parsing
 */

/**
 * Validates a JSON string with detailed error reporting
 * @param {string} jsonString - JSON string to validate
 * @returns {Object} { valid: boolean, error?: string, parsed?: any, position?: { line: number, column: number } }
 */
export function validateJSON(jsonString) {
  if (!jsonString || jsonString.trim() === '') {
    return { valid: true, error: null, parsed: {} }
  }

  try {
    const parsed = JSON.parse(jsonString)
    return { valid: true, error: null, parsed }
  } catch (error) {
    // Extract useful error message
    let message = error.message
    // Remove common prefixes
    message = message.replace(/JSON\.parse: /, '')
    message = message.replace(/Unexpected token/, 'Unexpected token')
    message = message.replace(/Unexpected end of JSON input/, 'Unexpected end of JSON')

    // Try to extract position
    const positionMatch = message.match(/position (\d+)/) || message.match(/at position (\d+)/)
    let position = null
    let line = 1
    let column = 1

    if (positionMatch) {
      position = parseInt(positionMatch[1], 10)
      // Find line and column from position
      const before = jsonString.substring(0, position)
      line = before.split('\n').length
      column = before.split('\n').pop().length + 1
    } else {
      // Try to find line number in error message
      const lineMatch = message.match(/line (\d+)/)
      if (lineMatch) {
        line = parseInt(lineMatch[1], 10)
      }
    }

    return {
      valid: false,
      error: message,
      position: position !== null ? { line, column, position } : null
    }
  }
}

/**
 * Validates environment variables structure
 * Ensures values are strings or can be stringified
 * @param {string} jsonString - JSON string to validate
 * @returns {Object} { valid: boolean, error?: string, parsed?: any }
 */
export function validateEnvVariables(jsonString) {
  const result = validateJSON(jsonString)
  if (!result.valid) return result

  // Additional validation for env vars - ensure they're simple values
  if (result.parsed && typeof result.parsed === 'object') {
    for (const [key, value] of Object.entries(result.parsed)) {
      // Check key is valid (alphanumeric, underscore, hyphen)
      if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(key)) {
        return {
          valid: false,
          error: `Invalid variable name "${key}". Use alphanumeric characters, underscores, and hyphens.`
        }
      }

      // Check value type is simple (string, number, boolean)
      const type = typeof value
      if (value !== null && type !== 'string' && type !== 'number' && type !== 'boolean') {
        return {
          valid: false,
          error: `Variable "${key}" has unsupported type "${type}". Use strings, numbers, or booleans.`
        }
      }
    }
  }

  return result
}

/**
 * Formats a JSON error for display
 * @param {Object} validationResult - Result from validateJSON or validateEnvVariables
 * @returns {string} Formatted error message
 */
export function formatJSONError(validationResult) {
  if (!validationResult.error) {
    return 'Valid JSON'
  }

  if (validationResult.position) {
    const { line, column } = validationResult.position
    return `${validationResult.error} (line ${line}, column ${column})`
  }

  return validationResult.error
}
