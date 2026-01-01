/**
 * Request Chaining Utilities for Gostman
 * Allows extracting values from responses and using them in subsequent requests
 *
 * Uses jsonpath-plus for robust JSONPath expression evaluation
 */

import { JSONPath } from 'jsonpath-plus'

/**
 * Extracts values from a response using JSONPath expressions
 * Supports full JSONPath syntax: filters, wildcards, expressions, etc.
 *
 * @param {Object|string} response - The response data (parsed JSON or string)
 * @param {string} path - The JSONPath expression (e.g., "$.data.user.id", "$.items[*].name")
 * @param {Object} options - JSONPath options
 * @returns {string|null} The extracted value or null if not found
 */
export function extractFromResponse(response, path, options = {}) {
  if (!path) return null

  // Default path to root if not specified
  const jsonPath = path.startsWith('$') ? path : `$.${path}`

  let data = response

  // Try to parse JSON if response is a string
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      // Not JSON, return raw if root selector
      return jsonPath === '$' || jsonPath === '$.' ? data : null
    }
  }

  // Handle special root selectors
  if (jsonPath === '$' || jsonPath === '$.' || path === 'body') {
    return typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)
  }

  // Handle status code extraction (not from body)
  if (path === 'statusCode' || path === 'status') {
    return null // Must be provided separately
  }

  // Handle header extraction (not from body)
  if (path.startsWith('header.')) {
    return null // Must be provided via extractFromHeaders
  }

  try {
    const result = JSONPath({
      path: jsonPath,
      json: data,
      wrap: false,
      ...options
    })

    if (result === undefined || result === null) {
      return null
    }

    // Return the value as a string
    if (typeof result === 'object') {
      return JSON.stringify(result, null, 2)
    }
    return String(result)
  } catch (error) {
    console.warn(`JSONPath extraction failed: ${error.message}`)
    return null
  }
}

/**
 * Extracts multiple values from a response using JSONPath
 * @param {Object|string} response - The response data
 * @param {string} path - The JSONPath expression
 * @returns {Array} Array of extracted values
 */
export function extractAllFromResponse(response, path) {
  if (!path) return []

  const jsonPath = path.startsWith('$') ? path : `$.${path}`

  let data = response

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return []
    }
  }

  try {
    const result = JSONPath({
      path: jsonPath,
      json: data,
      wrap: false,
      resultType: 'all'
    })

    if (!Array.isArray(result)) return []

    return result.map(item =>
      typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)
    )
  } catch {
    return []
  }
}

/**
 * Extracts a single value (first match) from response
 * @param {Object|string} response - The response data
 * @param {string} path - The JSONPath expression
 * @returns {string|null} First matching value
 */
export function extractFirstFromResponse(response, path) {
  const values = extractAllFromResponse(response, path)
  return values.length > 0 ? values[0] : null
}

/**
 * Extracts values from response headers
 * @param {Object} headers - Response headers object
 * @param {string} path - Path expression (e.g., "header.Content-Type")
 * @returns {string|null} The header value or null
 */
export function extractFromHeaders(headers, path) {
  if (!path || !path.startsWith('header.')) return null

  const headerName = path.substring(7)

  // Support JSONPath on headers too
  if (headers && typeof headers === 'object') {
    // Direct lookup
    if (headerName in headers) {
      return String(headers[headerName])
    }

    // Try to parse headers as JSON if it's a complex path
    try {
      const result = JSONPath({
        path: `$.${headerName}`,
        json: headers,
        wrap: false
      })
      if (result !== undefined) {
        return String(result)
      }
    } catch {}
  }

  return null
}

/**
 * Variable extraction configuration
 * Each extraction has: name, path, and optional scope
 */
export class VariableExtractor {
  constructor(options = {}) {
    this.extractors = []
    this.jsonPathOptions = options
  }

  /**
   * Add a variable extraction rule
   * @param {string} name - Variable name
   * @param {string} path - JSONPath to extract
   * @param {string} scope - Scope: 'local', 'environment', or 'global'
   */
  addExtractor(name, path, scope = 'environment') {
    this.extractors.push({ name, path, scope })
    return this
  }

  /**
   * Add multiple extractors at once
   * @param {Array} extractors - Array of {name, path, scope} objects
   */
  addExtractors(extractors) {
    extractors.forEach(({ name, path, scope }) => {
      this.addExtractor(name, path, scope)
    })
    return this
  }

  /**
   * Extract all variables from a response
   * @param {Object} options - Response data and metadata
   * @returns {Object} Extracted variables by scope
   */
  extract({ body, status, headers }) {
    const result = {
      local: {},
      environment: {},
      global: {}
    }

    this.extractors.forEach(({ name, path, scope }) => {
      let value = null

      if (path.startsWith('header.')) {
        value = extractFromHeaders(headers, path)
      } else if (path === 'statusCode' || path === 'status') {
        value = String(status || '')
      } else if (path.startsWith('$')) {
        // Use JSONPath directly
        value = extractFromResponse(body, path, this.jsonPathOptions)
      } else {
        // Convert dot notation to JSONPath
        value = extractFromResponse(body, path, this.jsonPathOptions)
      }

      if (value !== null) {
        result[scope][name] = value
      }
    })

    return result
  }

  /**
   * Test a JSONPath expression against sample data
   * @param {string} path - JSONPath expression to test
   * @param {Object} data - Sample data
   * @returns {Array} Results
   */
  testPath(path, data) {
    try {
      const result = JSONPath({
        path: path.startsWith('$') ? path : `$.${path}`,
        json: data,
        resultType: 'all'
      })
      return result
    } catch (error) {
      return { error: error.message }
    }
  }

  /**
   * Clear all extractors
   */
  clear() {
    this.extractors = []
  }

  /**
   * Get all extractors
   */
  getAll() {
    return [...this.extractors]
  }

  /**
   * Load extractors from an array
   */
  load(extractors) {
    this.extractors = extractors || []
  }

  /**
   * Remove an extractor by name
   */
  remove(name) {
    this.extractors = this.extractors.filter(e => e.name !== name)
    return this
  }
}

/**
 * Parses a test script to find variable extractions
 * Supports syntax similar to Postman:
 * pm.environment.set("key", pm.response.json().path)
 * pm.variables.set("key", value)
 *
 * @param {string} script - The test script
 * @returns {Array} Array of extraction rules
 */
export function parseTestScript(script) {
  const extractions = []

  if (!script || typeof script !== 'string') return extractions

  // Match patterns like: pm.environment.set("name", pm.response.json().path)
  const envSetRegex = /pm\.environment\.set\s*\(\s*["']([^"']+)["']\s*,\s*pm\.response\.(?:json\(\)|text\(\))\.([^\)]+)\s*\)/g
  let match

  while ((match = envSetRegex.exec(script)) !== null) {
    extractions.push({
      name: match[1],
      path: match[2],
      scope: 'environment'
    })
  }

  // Match patterns like: pm.variables.set("name", pm.response.json().path)
  const varSetRegex = /pm\.variables\.set\s*\(\s*["']([^"']+)["']\s*,\s*pm\.response\.(?:json\(\)|text\(\))\.([^\)]+)\s*\)/g

  while ((match = varSetRegex.exec(script)) !== null) {
    extractions.push({
      name: match[1],
      path: match[2],
      scope: 'local'
    })
  }

  return extractions
}

/**
 * Executes a simple test script and returns extracted variables
 *
 * @param {string} script - The test script to execute
 * @param {Object} context - Response context
 * @returns {Object} Extracted variables
 */
export function executeTestScript(script, context) {
  const extractions = parseTestScript(script)
  const extractor = new VariableExtractor()

  extractions.forEach(({ name, path, scope }) => {
    extractor.addExtractor(name, path, scope)
  })

  return extractor.extract(context)
}

/**
 * Creates a test script template for a given extraction
 * @param {string} variableName - The variable to set
 * @param {string} path - The path to extract
 * @param {string} scope - Variable scope
 * @returns {string} The test script
 */
export function createTestScript(variableName, path, scope = 'environment') {
  const pmScope = scope === 'global' ? 'pm.globals' : scope === 'environment' ? 'pm.environment' : 'pm.variables'

  if (path.startsWith('header.')) {
    return `${pmScope}.set("${variableName}", pm.response.headers.get("${path.substring(7)}"));`
  }

  if (path === 'statusCode' || path === 'status') {
    return `${pmScope}.set("${variableName}", pm.response.code);`
  }

  // Convert to JSONPath format if not already
  const jsonPath = path.startsWith('$') ? path : `$.${path}`

  return `${pmScope}.set("${variableName}", pm.response.json().${jsonPath.substring(2)});`
}

/**
 * Predefined variable templates for common API patterns
 * Now with proper JSONPath expressions
 */
export const VARIABLE_TEMPLATES = [
  { name: 'User ID', path: '$.data.user.id', description: 'Extract user ID from response' },
  { name: 'All User IDs', path: '$.data.users[*].id', description: 'Extract all user IDs (array)' },
  { name: 'Auth Token', path: '$.data.token', description: 'Extract authentication token' },
  { name: 'Session ID', path: '$.sessionId', description: 'Extract session identifier' },
  { name: 'Resource ID', path: '$.data.id', description: 'Extract resource identifier' },
  { name: 'First Item Name', path: '$.items[0].name', description: 'First item in array' },
  { name: 'All Names', path: '$..name', description: 'All name properties (recursive)' },
  { name: 'Filter Active', path: '$.items[?(@.active)].id', description: 'IDs of active items' },
  { name: 'Response Status', path: 'statusCode', description: 'HTTP status code' },
  { name: 'Location Header', path: 'header.Location', description: 'Location redirect header' },
  { name: 'Authorization Header', path: 'header.Authorization', description: 'Auth header from response' },
]

/**
 * JSONPath expression builder helper
 */
export class JSONPathBuilder {
  constructor() {
    this.parts = []
  }

  /**
   * Root selector
   */
  static root() {
    return new JSONPathBuilder()
  }

  /**
   * Add a property access
   * @param {string} property - Property name
   */
  prop(property) {
    this.parts.push(`.${property}`)
    return this
  }

  /**
   * Add array index
   * @param {number} index - Array index
   */
  index(index) {
    this.parts.push(`[${index}]`)
    return this
  }

  /**
   * Add wildcard for all items
   */
  any() {
    this.parts.push('[*]')
    return this
  }

  /**
   * Add filter expression
   * @param {string} expression - Filter expression (e.g., '@.age > 18')
   */
  filter(expression) {
    this.parts.push(`[?(${expression})]`)
    return this
  }

  /**
   * Recursive descent (search all levels)
   */
  recursive() {
    this.parts.push('..')
    return this
  }

  /**
   * Build the final JSONPath expression
   * @returns {string} JSONPath string
   */
  build() {
    return '$' + this.parts.join('')
  }

  /**
   * Execute the built path against data
   * @param {Object} data - Data to query
   * @returns {Array} Results
   */
  exec(data) {
    return JSONPath({ path: this.build(), json: data })
  }
}

/**
 * Combines existing variables with newly extracted ones
 * @param {Object} existing - Existing variables object
 * @param {Object} extracted - Extracted variables
 * @returns {Object} Combined variables
 */
export function mergeVariables(existing, extracted) {
  return {
    ...existing,
    ...extracted
  }
}

/**
 * Validates a JSONPath expression
 * @param {string} path - JSONPath to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateJSONPath(path) {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'Path must be a string' }
  }

  // Basic JSONPath syntax validation
  const validStart = /^(\$|\.\w+)/.test(path)

  if (!validStart) {
    return { valid: false, error: 'Path must start with $ or a property' }
  }

  // Try to compile (basic check)
  try {
    JSONPath({ path, json: {} })
    return { valid: true }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

/**
 * Suggests JSONPath completions for a given data structure
 * @param {Object} data - Sample data
 * @returns {Array} Array of suggestion objects
 */
export function suggestPaths(data) {
  const suggestions = []

  function traverse(obj, currentPath = '$') {
    if (obj === null || obj === undefined) return

    if (Array.isArray(obj)) {
      suggestions.push({
        path: `${currentPath}[*]`,
        description: 'All items in array'
      })

      if (obj.length > 0) {
        traverse(obj[0], `${currentPath}[0]`)
      }
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const newPath = `${currentPath}.${key}`
        suggestions.push({
          path: newPath,
          description: `Property: ${key} (${typeof obj[key]})`
        })

        if (typeof obj[key] === 'object' && obj[key] !== null && Object.keys(obj[key]).length < 10) {
          traverse(obj[key], newPath)
        }
      })
    }
  }

  traverse(data)

  return suggestions.slice(0, 50) // Limit to 50 suggestions
}
