/**
 * Import/Export utilities for Gostman
 * Supports Postman collections, OpenAPI specs, and Gostman's native format
 *
 * Uses modern libraries for robust parsing:
 * - @scalar/openapi-parser: OpenAPI 3.x/3.1 validation and parsing
 * - js-yaml: YAML conversion
 *
 * Postman collections are parsed natively (no SDK dependency - avoids lodash issues)
 */

import { dereference, validate } from '@scalar/openapi-parser'
import YAML from 'js-yaml'

// Constants for magic numbers
const MAX_RECURSION_DEPTH = 10
const MAX_TRUNCATION_LENGTH = 50
const DEBOUNCE_MS = 300
const MAX_FOLDER_DEPTH = 100
const MAX_VALIDATION_ERRORS = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

// Valid HTTP methods for Postman request validation
const VALID_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE']

/**
 * Safely stringifies a value, handling circular references and other edge cases.
 * Uses a WeakSet to track circular references and replaces them with a placeholder.
 * @param {any} value - The value to stringify
 * @param {string|null} [placeholder=null] - Placeholder for circular refs (defaults to "[Circular]")
 * @returns {string} JSON string or empty string on error
 */
function safeStringify(value, placeholder = null) {
  if (value === undefined) return ''
  if (value === null) return 'null'

  try {
    // For primitives, return directly
    if (typeof value !== 'object') {
      return JSON.stringify(value)
    }

    // Handle circular references
    const seen = new WeakSet()
    const circularPlaceholder = placeholder || '[Circular Reference]'

    const result = JSON.stringify(value, (key, val) => {
      // Handle circular references
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) {
          return circularPlaceholder
        }
        seen.add(val)
      }
      // Handle functions
      if (typeof val === 'function') {
        return '[Function]'
      }
      // Handle undefined
      if (val === undefined) {
        return null
      }
      // Handle symbols
      if (typeof val === 'symbol') {
        return val.toString()
      }
      return val
    }, 2)

    return result
  } catch (error) {
    // Fallback for very complex objects or edge cases
    console.warn('safeStringify failed:', error.message)
    try {
      return JSON.stringify(
        Object.keys(value || {}).reduce((acc, key) => {
          try {
            acc[key] = typeof value[key] === 'object'
              ? (Array.isArray(value[key]) ? [] : {})
              : value[key]
          } catch {
            acc[key] = '[Error accessing value]'
          }
          return acc
        }, {}),
        null,
        2
      )
    } catch {
      return '{}'
    }
  }
}

// Export the constants for use in other modules
export { MAX_FILE_SIZE, MAX_VALIDATION_ERRORS }

/**
 * Simple UUID generator (using crypto.randomUUID if available, else fallback)
 * @returns {string} A unique ID string
 */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Encodes a string to UTF-8 for use with btoa (handles Unicode characters)
 * @param {string} str - String to encode
 * @returns {string} UTF-8 encoded string safe for btoa
 */
function encodeUTF8(str) {
  return encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
    String.fromCharCode('0x' + p1)
  )
}

/**
 * Extract query parameters from a URL string or object
 * FIX #6: Query parameter key validation - check param.key is non-empty string
 * FIX: Handle duplicate query param keys by using arrays
 * @param {string|Object} url - URL string or Postman URL object
 * @returns {Object} Query parameters as key-value pairs (arrays for duplicates)
 */
function extractQueryParams(url) {
  const queryParams = {}

  if (typeof url === 'string') {
    // Parse query params from URL string
    try {
      const urlObj = new URL(url)
      urlObj.searchParams.forEach((value, key) => {
        // Handle duplicates: if key exists, convert to array or append to array
        if (key in queryParams) {
          if (Array.isArray(queryParams[key])) {
            queryParams[key].push(value)
          } else {
            queryParams[key] = [queryParams[key], value]
          }
        } else {
          queryParams[key] = value
        }
      })
    } catch (err) {
      // Invalid URL, return empty
      console.warn('Failed to parse URL for query params:', err.message)
    }
    return queryParams
  }

  // Handle Postman URL object format
  if (url && url.query) {
    const queryList = Array.isArray(url.query) ? url.query : []
    queryList.forEach(param => {
      // FIX #6: Validate param.key is a non-empty string
      if (!param.disabled && param.key && typeof param.key === 'string' && param.key.trim()) {
        const value = param.value !== undefined ? String(param.value) : ''
        // Handle duplicates: if key exists, convert to array or append to array
        if (param.key in queryParams) {
          if (Array.isArray(queryParams[param.key])) {
            queryParams[param.key].push(value)
          } else {
            queryParams[param.key] = [queryParams[param.key], value]
          }
        } else {
          queryParams[param.key] = value
        }
      }
    })
  }

  return queryParams
}

/**
 * Extract headers from a headers array
 * @param {Array} headers - Array of header objects
 * @returns {Object} Headers as key-value pairs
 */
function extractHeaders(headers) {
  const result = {}

  if (!Array.isArray(headers)) return result

  headers.forEach(header => {
    // Validate key is non-empty string and trim whitespace
    if (!header.disabled && header.key && typeof header.key === 'string' && header.key.trim()) {
      result[header.key] = header.value || ''
    }
  })

  return result
}

/**
 * Extract body from a Postman RequestBody
 * FIX #7: GraphQL body extraction - validate query is string before using
 * @param {Object} requestBody - Postman RequestBody
 * @returns {string} Body as string
 */
function extractBody(requestBody) {
  if (!requestBody) return ''

  switch (requestBody.mode) {
    case 'raw':
      return requestBody.raw || ''

    case 'urlencoded':
      const formData = {}
      if (Array.isArray(requestBody.urlencoded)) {
        requestBody.urlencoded.forEach(param => {
          if (!param.disabled && param.key) {
            formData[param.key] = param.value || ''
          }
        })
      }
      return safeStringify(formData)

    case 'formdata':
      const form = {}
      if (Array.isArray(requestBody.formdata)) {
        requestBody.formdata.forEach(param => {
          if (!param.disabled && param.key) {
            form[param.key] = param.value || ''
          }
        })
      }
      return safeStringify(form)

    case 'graphql':
      if (requestBody.graphql) {
        // FIX #7: Validate query is string before using
        if (typeof requestBody.graphql === 'string') {
          return requestBody.graphql
        }
        if (requestBody.graphql.query && typeof requestBody.graphql.query === 'string') {
          return safeStringify({ query: requestBody.graphql.query })
        }
      }
      return ''

    default:
      return ''
  }
}

/**
 * Get URL from Postman request URL object
 * FIX #2: URL building from parts - handle path as either array or string
 * @param {string|Object} url - URL string or Postman URL object
 * @returns {string} Full URL string
 */
function getUrlString(url) {
  if (typeof url === 'string') return url

  // Handle Postman URL object format
  if (url && url.raw) return url.raw

  // Build URL from parts
  if (url && url.protocol && url.host) {
    // Ensure protocol doesn't already contain ://
    const protocol = url.protocol.endsWith('://') ? url.protocol : url.protocol + '://'
    let urlString = protocol + (Array.isArray(url.host) ? url.host.join('.') : url.host)
    if (url.port) urlString += ':' + url.port

    // FIX #2: Handle path as either array or string using Array.isArray()
    if (url.path) {
      const pathStr = Array.isArray(url.path) ? url.path.join('/') : url.path
      urlString += '/' + pathStr
    }

    if (url.query && url.query.length > 0) {
      const params = url.query.filter(p => !p.disabled).map(p =>
        `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || '')}`
      )
      urlString += '?' + params.join('&')
    }
    return urlString
  }

  return ''
}

/**
 * Recursively processes Postman collection items
 * @param {Array} items - Array of Postman items
 * @param {string|null} parentFolderId - Parent folder ID
 * @param {Array} requests - Accumulator for requests
 * @param {Array} folders - Accumulator for folders
 * @param {Set} usedIds - Set of already used IDs to prevent duplicates
 * @param {Array} unsupportedAuthWarnings - Accumulator for unsupported auth warnings
 * @param {number} depth - Current depth for recursion protection
 */
function processPostmanItems(items, parentFolderId, requests, folders, usedIds = new Set(), unsupportedAuthWarnings = [], depth = 0) {
  // FIX #5: Max depth check to prevent stack overflow
  if (depth > MAX_FOLDER_DEPTH) {
    console.warn(`Postman import: maximum folder depth (${MAX_FOLDER_DEPTH}) exceeded, skipping deeper folders`)
    return
  }

  if (!Array.isArray(items)) return

  items.forEach(item => {
    // Check if it's a folder (has items array)
    if (item.item && Array.isArray(item.item)) {
      let folderId = item.id || generateId()
      // Ensure unique ID
      while (usedIds.has(folderId)) {
        folderId = generateId()
      }
      usedIds.add(folderId)

      folders.push({
        id: folderId,
        name: (item.name || 'Folder').trim().substring(0, 100), // Max 100 chars
        isOpen: false,
        parentId: parentFolderId,
        description: item.description || ''
      })
      // FIX #5: Pass depth + 1 to track recursion depth
      processPostmanItems(item.item, folderId, requests, folders, usedIds, unsupportedAuthWarnings, depth + 1)
    }
    // Check if it's a request (has request object)
    else if (item.request) {
      const request = item.request

      // Get URL
      const url = getUrlString(request.url)

      // FIX #1: Missing URL validation - check if URL is empty and skip request
      if (!url || !url.trim()) {
        console.warn(`Postman import: skipping request "${item.name || 'Untitled'}" with empty URL`)
        return
      }

      // Extract query parameters
      const queryParams = extractQueryParams(request.url)

      // Extract headers
      const headers = extractHeaders(request.header || [])

      // Add auth headers if present and not disabled
      if (request.auth && !request.auth.disabled && request.auth.type) {
        if (request.auth.type === 'bearer' && request.auth.bearer) {
          let token = '{{token}}'
          if (Array.isArray(request.auth.bearer) && request.auth.bearer[0]) {
            token = request.auth.bearer[0].value || token
          } else if (typeof request.auth.bearer === 'string') {
            token = request.auth.bearer
          } else if (request.auth.bearer?.value) {
            token = request.auth.bearer.value
          }
          headers['Authorization'] = `Bearer ${token}`
        } else if (request.auth.type === 'basic' && request.auth.basic) {
          // Handle both array and single object formats
          const basicAuth = Array.isArray(request.auth.basic) ? request.auth.basic[0] : request.auth.basic
          const username = basicAuth?.username || basicAuth?.value?.username || '{{username}}'
          const password = basicAuth?.password || basicAuth?.value?.password || '{{password}}'
          // Handle Unicode in credentials
          headers['Authorization'] = `Basic ${btoa(encodeUTF8(username + ':' + password))}`
        } else if (request.auth.type === 'apikey' && request.auth.apikey) {
          // FIX #4: Improved apikey auth handling for different formats
          const apikeyAuth = Array.isArray(request.auth.apikey) ? request.auth.apikey[0] : request.auth.apikey
          if (apikeyAuth) {
            // Handle different Postman apikey formats
            const key = apikeyAuth.key || apikeyAuth.value?.key
            const value = apikeyAuth.value || apikeyAuth.value?.value || '{{apiKey}}'
            if (key && typeof key === 'string') {
              headers[key] = value
            }
          }
        } else if (request.auth.type === 'awsv4' || request.auth.type === 'ntlm' ||
                   request.auth.type === 'digest' || request.auth.type === 'edgegrid' ||
                   request.auth.type === 'oauth1' || request.auth.type === 'oauth2') {
          // Track unsupported auth types
          const warning = `Auth type '${request.auth.type}' is not fully supported. Request: ${item.name || 'Untitled'}`
          if (!unsupportedAuthWarnings.includes(warning)) {
            unsupportedAuthWarnings.push(warning)
          }
          // Add warning header so user knows about the limitation
          headers['X-Gostman-Auth-Warning'] = `Unsupported auth type: ${request.auth.type}. Please configure manually.`
        }
      }

      // Extract body
      const body = extractBody(request.body)

      // Ensure unique request ID
      let requestId = item.id || generateId()
      while (usedIds.has(requestId)) {
        requestId = generateId()
      }
      usedIds.add(requestId)

      // FIX #9: Trim request name and check for empty
      let requestName = (item.name || request.name || 'Untitled Request').trim()
      if (!requestName) {
        requestName = 'Untitled Request'
      }

      // FIX #3: Missing HTTP method validation - validate and default to GET if invalid
      let method = 'GET'
      if (request.method) {
        const normalizedMethod = request.method.toString().trim().toUpperCase()
        method = VALID_HTTP_METHODS.includes(normalizedMethod) ? normalizedMethod : 'GET'
      }

      requests.push({
        id: requestId,
        name: requestName,
        url,
        method,
        headers: safeStringify(headers),
        body,
        queryParams: safeStringify(queryParams),
        response: '',
        folderId: parentFolderId,
        description: item.description || request.description || '',
        createdAt: new Date().toISOString()
      })
    }
  })
}

/**
 * Converts a Postman collection to Gostman requests (native parser, no SDK dependency)
 * @param {Object|string} postmanCollection - Parsed Postman collection JSON
 * @returns {Object} Object with requests array, folders array, collection name, and warnings
 */
export function importPostmanCollection(postmanCollection) {
  const data = typeof postmanCollection === 'string' ? JSON.parse(postmanCollection) : postmanCollection

  const requests = []
  const folders = []
  const usedIds = new Set()
  const unsupportedAuthWarnings = []

  const collectionName = data?.info?.name || 'Imported Collection'

  // Initialize external refs and circular refs tracking on the spec object
  if (!data._externalRefs) {
    data._externalRefs = []
  }
  if (!data._circularRefs) {
    data._circularRefs = []
  }

  // Process items (can be at root or nested)
  processPostmanItems(data.item || [], null, requests, folders, usedIds, unsupportedAuthWarnings)

  return {
    requests,
    folders,
    collectionName,
    warnings: unsupportedAuthWarnings
  }
}

/**
 * Parses a Postman collection JSON string (native parser, no SDK dependency)
 * FIX #8: Collection schema validation - check schema contains 'postman.com/json/collection'
 * @param {string} jsonString - JSON string of Postman collection
 * @returns {Object} Parsed result with requests and folders
 */
export function parsePostmanCollection(jsonString) {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString

    // FIX #8: Basic validation - check if it looks like a Postman collection
    // Validate schema contains 'postman.com/json/collection'
    if (!data || !data.info || !data.info.schema) {
      return {
        success: false,
        error: 'Invalid Postman collection format: missing info.schema'
      }
    }

    const schema = data.info.schema
    if (typeof schema === 'string' && !schema.includes('postman.com/json/collection')) {
      return {
        success: false,
        error: 'Invalid Postman collection format: schema does not match Postman collection format'
      }
    }

    // Import the collection
    const result = importPostmanCollection(data)

    return {
      success: true,
      ...result
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Invalid Postman collection format'
    }
  }
}

/**
 * Validates a URL string for proper protocol and format
 * @param {string} url - URL string to validate
 * @returns {Object} Validation result with { valid: boolean, error?: string, isRelative?: boolean }
 */
function validateUrl(url) {
  // Check if URL is provided
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'URL must be a non-empty string',
      isRelative: false
    }
  }

  const trimmedUrl = url.trim()

  // Check if URL is empty after trimming
  if (!trimmedUrl) {
    return {
      valid: false,
      error: 'URL cannot be empty',
      isRelative: false
    }
  }

  // Check for valid protocol (http://, https://, ws://, wss://)
  const validProtocols = ['http://', 'https://', 'ws://', 'wss://']
  const hasValidProtocol = validProtocols.some(protocol =>
    trimmedUrl.toLowerCase().startsWith(protocol)
  )

  if (!hasValidProtocol) {
    // This is a relative URL (no protocol scheme)
    return {
      valid: false,
      error: 'URL must have a valid protocol scheme (http://, https://, ws://, wss://)',
      isRelative: true
    }
  }

  // Try to parse the URL to validate format
  try {
    new URL(trimmedUrl)
  } catch (err) {
    return {
      valid: false,
      error: `Invalid URL format: ${err.message}`,
      isRelative: false
    }
  }

  // URL is valid
  return { valid: true, isRelative: false }
}

/**
 * Joins URL parts, handling trailing/leading slashes correctly
 * @param {string} baseUrl - Base URL
 * @param {string} path - Path to append
 * @returns {string} Properly joined URL
 *
 * @example
 * joinUrlParts("https://api.example.com", "/users") → "https://api.example.com/users"
 * joinUrlParts("https://api.example.com/", "users") → "https://api.example.com/users"
 * joinUrlParts("https://api.example.com/", "/users") → "https://api.example.com/users"
 */
function joinUrlParts(baseUrl, path) {
  if (!baseUrl) return path || ''
  if (!path) return baseUrl

  // Remove trailing slash from baseUrl if present
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  // Remove leading slash from path if present
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path

  // Join with single slash
  return normalizedBase + '/' + normalizedPath
}

/**
 * Gets base URL from server configuration, handling variables
 * @param {Object} server - OpenAPI server object
 * @returns {{url: string, isRelative: boolean}} Object with URL and relative flag
 */
function getServerUrl(server) {
  if (!server) return { url: '', isRelative: false }

  let url = server.url || ''

  // Substitute server variables with their default values
  if (server.variables) {
    Object.entries(server.variables || {}).forEach(([name, config]) => {
      const defaultValue = config.default ?? config.enum?.[0]
      if (defaultValue === undefined) {
        // Variable has no default value - keep placeholder and warn
        console.warn(`Server variable {${name}} has no default value`)
        return // Don't substitute - leave placeholder intact
      }
      url = url.replace(`{${name}}`, defaultValue)
    })
  }

  // Check if URL is relative (doesn't start with http:// or https://)
  const isRelative = !url.match(/^https?:\/\//i)

  return { url, isRelative }
}

/**
 * Builds security header templates from OpenAPI security schemes
 * @param {Object} securitySchemes - OpenAPI components.securitySchemes
 * @returns {Object} Headers object with authorization templates
 */
function buildSecurityHeaders(securitySchemes = {}) {
  const headers = {}

  Object.entries(securitySchemes || {}).forEach(([, scheme]) => {
    if (scheme.type === 'http') {
      if (scheme.scheme === 'bearer') {
        headers['Authorization'] = 'Bearer {{token}}'
      } else if (scheme.scheme === 'basic') {
        headers['Authorization'] = 'Basic {{credentials}}'
      }
    } else if (scheme.type === 'apiKey') {
      if (scheme.in === 'header') {
        headers[scheme.name] = '{{apiKey}}'
      }
    } else if (scheme.type === 'oauth2') {
      headers['Authorization'] = 'Bearer {{accessToken}}'
    } else if (scheme.type === 'openIdConnect') {
      headers['Authorization'] = 'Bearer {{idToken}}'
    }
  })

  return headers
}

/**
 * Extracts query parameters from an OpenAPI operation
 * @param {Object} operation - OpenAPI operation object
 * @param {Array} pathParameters - Path-level parameters to merge
 * @returns {Object|null} Query parameters as key-value pairs, or null if empty
 */
function extractOpenAPIQueryParams(operation = {}, pathParameters = []) {
  const queryParams = {}

  // Merge path-level and operation-level parameters (operation overrides path)
  const paramMap = new Map()

  // Add path-level parameters first
  ;(pathParameters || [])
    .filter(p => p && p.in === 'query')
    .forEach(param => paramMap.set(param.name, param))

  // Override with operation-level parameters
  ;(operation.parameters || [])
    .filter(p => p && p.in === 'query')
    .forEach(param => paramMap.set(param.name, param))

  // Convert to query params object
  paramMap.forEach(param => {
    const value = param.example ||
                  param.schema?.example ||
                  getExampleValueFromSchema(param.schema)
    queryParams[param.name] = value !== undefined ? String(value) : ''
  })

  // Return null if no params, otherwise return the object
  return Object.keys(queryParams).length > 0 ? queryParams : null
}

/**
 * Extracts path parameters from URL and OpenAPI operation
 * @param {string} path - URL path with {param} placeholders
 * @param {Object} operation - OpenAPI operation object
 * @param {Array} pathParameters - Path-level parameters
 * @returns {Object} Path parameters as key-value pairs
 */
function extractOpenAPIPathParams(path, operation = {}, pathParameters = []) {
  const pathParams = {}

  // Find all {param} placeholders in the path
  const pathParamMatches = path.match(/\{([^}]+)\}/g) || []
  const pathParamNames = pathParamMatches.map(match => match.slice(1, -1))

  // Build a map of all path parameters
  const paramMap = new Map()

  // Add path-level parameters first
  ;(pathParameters || [])
    .filter(p => p && p.in === 'path')
    .forEach(param => paramMap.set(param.name, param))

  // Override with operation-level parameters
  ;(operation.parameters || [])
    .filter(p => p && p.in === 'path')
    .forEach(param => paramMap.set(param.name, param))

  // Extract values for each path parameter found in the URL
  pathParamNames.forEach(paramName => {
    const param = paramMap.get(paramName)

    // Warn if path parameter is not defined in OpenAPI parameters
    if (!param) {
      console.warn(
        `Path parameter "{${paramName}}" is used in the URL path ` +
        `but is not defined in the OpenAPI parameters. ` +
        `Add a parameter definition with 'in: path' and 'required: true'.`
      )
    }

    const value = param?.example ||
                  param?.schema?.example ||
                  getExampleValueFromSchema(param?.schema) ||
                  `{{${paramName}}}`
    pathParams[paramName] = String(value)
  })

  return pathParams
}

/**
 * Extracts headers from an OpenAPI operation
 * @param {Object} operation - OpenAPI operation object
 * @param {Array} pathParameters - Path-level parameters to merge
 * @returns {Object} Headers as key-value pairs
 */
function extractOpenAPIHeaders(operation = {}, pathParameters = []) {
  const headers = {}

  // Merge path-level and operation-level parameters (operation overrides path)
  const paramMap = new Map()

  // Add path-level parameters first
  ;(pathParameters || [])
    .filter(p => p && p.in === 'header')
    .forEach(param => paramMap.set(param.name, param))

  // Override with operation-level parameters
  ;(operation.parameters || [])
    .filter(p => p && p.in === 'header')
    .forEach(param => paramMap.set(param.name, param))

  // Convert to headers object
  paramMap.forEach(param => {
    const value = param.example ||
                  param.schema?.example ||
                  getExampleValueFromSchema(param.schema)
    if (value !== undefined) {
      headers[param.name] = String(value)
    }
  })

  return headers
}

/**
 * Builds request body from OpenAPI requestBody
 * @param {Object} requestBody - OpenAPI request body
 * @returns {string} Body as string
 */
function buildOpenAPIBody(requestBody) {
  if (!requestBody) return ''

  const contentTypes = Object.keys(requestBody.content || {})
  if (contentTypes.length === 0) {
    console.warn(
      'Request body defined but has no content types. ' +
      'Add at least one content type (e.g., application/json) to the requestBody.content object.'
    )
    return ''
  }

  // Priority order for content types
  const typePriority = [
    'application/json',
    'application/ld+json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
    'application/xml',
    'text/xml'
  ]

  // Find the first matching content type
  let selectedType = contentTypes.find(ct => typePriority.includes(ct)) || contentTypes[0]
  const content = requestBody.content[selectedType]

  if (!content) return ''

  // Use example if available
  if (content.example !== undefined) {
    const example = content.example
    if (selectedType.includes('json') || selectedType.includes('ld+json')) {
      return typeof example === 'string' ? example : safeStringify(example)
    }
    // For text types, return as-is if string
    if (selectedType.startsWith('text/') && typeof example === 'string') {
      return example
    }
    // For other types, stringify objects
    return typeof example === 'object' ? safeStringify(example) : String(example)
  }

  // Try examples (OpenAPI 3.1)
  if (content.examples) {
    const firstExample = Object.values(content.examples || {})[0]
    if (firstExample?.value !== undefined) {
      const value = firstExample.value
      if (selectedType.includes('json') || selectedType.includes('ld+json')) {
        return typeof value === 'string' ? value : safeStringify(value)
      }
      if (selectedType.startsWith('text/') && typeof value === 'string') {
        return value
      }
      return typeof value === 'object' ? safeStringify(value) : String(value)
    }
  }

  // Generate from schema
  if (content.schema) {
    if (selectedType.includes('json') || selectedType.includes('ld+json')) {
      return generateExampleFromSchema(content.schema)
    }
    // For non-JSON types, still try to generate JSON (not ideal but functional)
    return generateExampleFromSchema(content.schema)
  }

  return ''
}

/**
 * Gets an example value from an OpenAPI schema
 * @param {Object} schema - OpenAPI schema object
 * @returns {any} Example value
 */
function getExampleValueFromSchema(schema) {
  if (!schema) return undefined

  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default

  // Simple type inference
  switch (schema.type) {
    case 'string':
      return schema.enum?.[0] ||
             schema.format === 'email' ? 'user@example.com' :
             schema.format === 'uuid' ? '550e8400-e29b-41d4-a716-446655440000' :
             schema.format === 'uri' ? 'https://example.com' :
             schema.format === 'date' ? '2024-01-01' :
             schema.format === 'date-time' ? '2024-01-01T00:00:00Z' :
             schema.format === 'binary' ? '(binary data)' :
             schema.format === 'byte' ? 'ZXhhbXBsZQ==' :
             'string'
    case 'number':
    case 'integer':
      return schema.minimum ?? schema.exclusiveMinimum ?? schema.default ?? 0
    case 'boolean':
      return schema.default !== undefined ? schema.default : true
    case 'array':
      return []
    case 'object':
      // Handle objects with properties but no explicit type
      return schema.properties ? {} : undefined
    default:
      // If no type specified but has properties, treat as object
      if (schema.properties) return {}
      // If has const, return const value
      if (schema.const !== undefined) return schema.const
      return undefined
  }
}

/**
 * Resolves a $ref reference in the spec
 * @param {string} ref - The $ref string
 * @param {Object} spec - The full OpenAPI spec
 * @returns {Object|null} The resolved schema or null if not found
 */
function resolveRef(ref, spec) {
  if (!ref || !spec) return null

  // Handle external references - track them but don't resolve
  if (!ref.startsWith('#/')) {
    // Track external refs in the spec
    if (!spec._externalRefs) {
      spec._externalRefs = []
    }
    if (!spec._externalRefs.includes(ref)) {
      spec._externalRefs.push(ref)
    }
    return null // External references not supported
  }

  // Navigate the reference path
  const path = ref.substring(2).split('/')
  let current = spec

  for (const key of path) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return null
    }
  }

  return current
}

/**
 * Generates a JSON example from an OpenAPI schema
 * @param {Object} schema - OpenAPI schema object
 * @param {number} depth - Current recursion depth
 * @param {WeakSet} seenSchemas - WeakSet of seen schema objects to detect circular references
 * @param {Object} spec - Full OpenAPI spec for $ref resolution
 * @returns {string} JSON string of generated example
 */
function generateExampleFromSchema(schema, depth = 0, seenSchemas = null, spec = null) {
  if (depth > MAX_RECURSION_DEPTH) {
    return '{}'
  }

  if (!schema) return '{}'

  // Initialize circular refs tracking on spec
  if (spec && !spec._circularRefs) {
    spec._circularRefs = []
  }

  // Use a single WeakSet per top-level call to track seen schemas
  const freshSeenSchemas = seenSchemas || new WeakSet()

  function generate(schema, currentDepth, seen) {
    if (currentDepth > MAX_RECURSION_DEPTH) {
      return null
    }

    // Handle $ref by resolving it
    if (schema.$ref) {
      const resolved = resolveRef(schema.$ref, spec)

      // Check for circular reference using WeakSet for object identity tracking
      if (!resolved) {
        return {}
      }

      // Track actual schema objects, not ref strings
      if (seen.has(resolved)) {
        // Circular reference detected - track and skip
        if (spec && !spec._circularRefs.includes(schema.$ref)) {
          spec._circularRefs.push(schema.$ref)
        }
        return null // Skip circular refs instead of including placeholder
      }

      // Reuse the same WeakSet for tracking
      seen.add(resolved)
      return generate(resolved, currentDepth + 1, seen)
    }

    // Handle allOf - merge all schemas
    if (schema.allOf && Array.isArray(schema.allOf)) {
      const result = {}
      let hasRequired = []
      schema.allOf.forEach(sub => {
        const generated = generate(sub, currentDepth + 1, seen)
        if (generated && typeof generated === 'object') {
          Object.assign(result, generated)
          if (sub.required) {
            hasRequired = hasRequired.concat(sub.required)
          }
        }
      })
      // Store required fields metadata
      if (hasRequired.length > 0) {
        result._required = hasRequired
      }
      return result
    }

    // Handle anyOf - use first valid schema
    if (schema.anyOf && Array.isArray(schema.anyOf)) {
      for (const sub of schema.anyOf) {
        const generated = generate(sub, currentDepth + 1, seen)
        if (generated !== null) {
          return generated
        }
      }
      return {}
    }

    // Handle oneOf - use first schema
    if (schema.oneOf && Array.isArray(schema.oneOf)) {
      const schemas = schema.oneOf
      if (schemas.length > 0) {
        return generate(schemas[0], currentDepth + 1, seen)
      }
      return {}
    }

    const schemaType = schema.type || (schema.properties ? 'object' : schema.enum ? 'string' : undefined)

    // Warn about invalid schema without type, enum, or const
    if (!schemaType && !schema.enum && schema.const === undefined) {
      console.warn(
        'Schema is missing "type" property and has no "enum" or "const" values. ' +
        'This may result in invalid example generation.'
      )
    }

    switch (schemaType) {
      case 'string': {
        const example = getExampleValueFromSchema(schema)
        return example !== undefined ? example : 'string'
      }
      case 'number':
      case 'integer': {
        const example = getExampleValueFromSchema(schema)
        return example !== undefined ? example : 0
      }
      case 'boolean':
        return schema.default !== undefined ? schema.default : true
      case 'array': {
        if (schema.items) {
          return [generate(schema.items, currentDepth + 1, seen)]
        }
        return []
      }
      case 'object': {
        if (!schema.properties) return {}
        const obj = {}
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
          // Include required properties or those with defaults/examples
          if (schema.required?.includes(key) ||
              propSchema.default !== undefined ||
              propSchema.example !== undefined ||
              propSchema.const !== undefined) {
            obj[key] = generate(propSchema, currentDepth + 1, seen)
          }
        })
        // If object is empty, add at least one property for reference
        if (Object.keys(obj).length === 0) {
          const firstKey = Object.keys(schema.properties)[0]
          if (firstKey) {
            obj[firstKey] = generate(schema.properties[firstKey], currentDepth + 1, seen)
          }
        }
        return obj
      }
      default:
        // Handle schemas without explicit type but with const
        if (schema.const !== undefined) {
          return schema.const
        }
        // Handle enum
        if (schema.enum && schema.enum.length > 0) {
          return schema.enum[0]
        }
        return {}
    }
  }

  const result = generate(schema, depth, freshSeenSchemas)
  return JSON.stringify(result, null, 2)
}

/**
 * Converts an OpenAPI 3.x spec to Gostman requests
 * @param {Object} openapiSpec - Validated OpenAPI spec object
 * @returns {Object} Object with requests array, folders array, and collection name
 */
export function importOpenAPISpec(openapiSpec) {
  const requests = []
  const folders = []

  // Initialize tracking arrays
  if (!openapiSpec._externalRefs) {
    openapiSpec._externalRefs = []
  }
  if (!openapiSpec._circularRefs) {
    openapiSpec._circularRefs = []
  }

  if (!openapiSpec.paths || typeof openapiSpec.paths !== 'object') {
    throw new Error('Invalid OpenAPI spec: paths must be an object')
  }

  // Reject Swagger 2.0
  if (openapiSpec.swagger && !openapiSpec.openapi) {
    throw new Error('Swagger 2.0 is not supported. Please use OpenAPI 3.x.')
  }

  // Extract collection info
  const collectionName = openapiSpec.info?.title || 'Imported OpenAPI Spec'

  // Get base URL from first server, handling variables
  const { url: baseUrl, isRelative } = getServerUrl(openapiSpec.servers?.[0])

  // Check for missing or empty servers array
  const servers = openapiSpec.servers
  if (!servers || servers.length === 0 || !baseUrl) {
    throw new Error(
      'This OpenAPI spec has no servers defined or the server URL is empty. ' +
      'Add a "servers" array with at least one server object containing a valid URL. ' +
      'Example: servers: [{ url: "https://api.example.com" }]'
    )
  }

  // Check for relative server URLs and provide a clear error
  if (isRelative) {
    throw new Error(
      'This OpenAPI spec uses a relative server URL. ' +
      'Please provide the full base URL (e.g., https://api.example.com)'
    )
  }

  // Validate paths exist
  const paths = openapiSpec.paths || {}
  if (Object.keys(paths).length === 0) {
    throw new Error(
      'This OpenAPI spec has no paths defined. ' +
      'A valid OpenAPI spec must define at least one path with an operation.'
    )
  }

  // First pass: collect all used tags
  const usedTags = new Set()
  const pathValues = Object.values(paths)
  if (Array.isArray(pathValues)) {
    pathValues.forEach(pathItem => {
      if (!pathItem || typeof pathItem !== 'object') return
      const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']
      httpMethods.forEach(method => {
        const operation = pathItem[method]
        if (operation?.tags && Array.isArray(operation.tags)) {
          operation.tags.forEach(tag => usedTags.add(tag))
        }
      })
    })
  }

  // Create folders only for used tags
  const tagFolderMap = new Map()
  const tags = Array.isArray(openapiSpec.tags) ? openapiSpec.tags : []

  tags.forEach(tag => {
    if (usedTags.has(tag.name)) {
      const folderId = generateId()
      tagFolderMap.set(tag.name, folderId)
      folders.push({
        id: folderId,
        name: tag.name,
        isOpen: false,
        parentId: null,
        description: tag.description || ''
      })
    }
  })

  // Build security scheme headers
  const securityHeaders = buildSecurityHeaders(openapiSpec.components?.securitySchemes || {})

  // Process paths
  const pathsEntries = Object.entries(openapiSpec.paths || {})
  pathsEntries.forEach(([path, pathItem]) => {
    // Keep path as-is with {param} format
    const fullPath = joinUrlParts(baseUrl, path)

    // Get path-level parameters (shared across all methods in this path)
    const pathParameters = Array.isArray(pathItem.parameters) ? pathItem.parameters : []

    // Process each HTTP method
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']

    httpMethods.forEach(method => {
      const operation = pathItem[method]
      if (!operation) return

      // Determine folder from tags (use first tag)
      const operationTags = Array.isArray(operation.tags) ? operation.tags : []
      const folderId = operationTags[0]
        ? tagFolderMap.get(operationTags[0]) || null
        : null

      // Build query parameters (merge path-level and operation-level)
      const queryParams = extractOpenAPIQueryParams(operation, pathParameters)

      // Extract path parameters from the URL
      const pathParams = extractOpenAPIPathParams(path, operation, pathParameters)

      // Build headers (security headers first, operation headers can override)
      const operationHeaders = extractOpenAPIHeaders(operation, pathParameters)
      const headers = { ...(securityHeaders || {}) }

      // Only add operation headers that don't conflict with security headers
      Object.entries(operationHeaders || {}).forEach(([key, value]) => {
        if (!(key in securityHeaders)) {
          headers[key] = value
        }
      })

      // Build body
      const body = buildOpenAPIBody(operation.requestBody)

      // Store schema metadata for future use
      const metadata = {
        openapi: {
          operationId: operation.operationId,
          schema: operation.requestBody?.content?.['application/json']?.schema,
          parameters: operation.parameters,
          pathParams,
          responses: operation.responses?.[200]?.content?.['application/json']?.schema
        }
      }

      // Build the full URL with path params substituted for display
      let displayUrl = fullPath
      if (Object.keys(pathParams || {}).length > 0) {
        // Substitute path params for display URL
        Object.entries(pathParams || {}).forEach(([paramName, paramValue]) => {
          displayUrl = displayUrl.replace(`{${paramName}}`, paramValue)
        })
        // Store original path params in metadata for reference
        metadata.openapi.pathParamsRaw = pathParams
      }

      // Generate unique operation name with counter for duplicates
      const operationNameBase = operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`
      let operationName = operationNameBase
      let nameCounter = 1

      // Ensure uniqueness by adding counter if name already exists
      while (requests.some(r => r.name === operationName)) {
        operationName = `${operationNameBase} (${nameCounter})`
        nameCounter++
      }

      requests.push({
        id: generateId(),
        name: operationName,
        url: displayUrl,
        method: method.toUpperCase(),
        headers: safeStringify(headers),
        body,
        queryParams: queryParams !== null ? safeStringify(queryParams) : '',
        response: '',
        folderId,
        description: operation.description || operation.summary || '',
        createdAt: new Date().toISOString(),
        metadata: safeStringify(metadata)
      })
    })
  })

  return {
    requests,
    folders,
    collectionName,
    warnings: []
  }
}

/**
 * Parses an OpenAPI spec string (JSON or YAML) and converts to Gostman format
 * @param {string} specString - OpenAPI spec as JSON or YAML string
 * @returns {Promise<Object>} Parsed result with success flag, requests, folders, and error if failed
 */
export async function parseOpenAPISpec(specString) {
  let jsonError = null
  let yamlError = null

  try {
    // Validate input is not empty
    if (!specString || typeof specString !== 'string' || !specString.trim()) {
      return {
        success: false,
        error: 'Empty or invalid input'
      }
    }

    let spec

    // Try JSON first, capture error for better reporting
    try {
      spec = JSON.parse(specString)
    } catch (jsonErr) {
      jsonError = jsonErr
      // Try YAML, capture error for better reporting
      try {
        spec = parseYAML(specString)
      } catch (yamlErr) {
        yamlError = yamlErr
        // Both parsers failed - provide combined error message
        return {
          success: false,
          error: `Could not parse the file as valid JSON or YAML.\n\nJSON error: ${jsonError.message || 'Invalid JSON syntax'}\nYAML error: ${yamlError.message || 'Invalid YAML syntax'}\n\nPlease check that your file is properly formatted.`
        }
      }
    }

    // Validate we got a proper object
    if (!spec || typeof spec !== 'object') {
      return {
        success: false,
        error: 'Invalid OpenAPI spec: could not parse as JSON or YAML'
      }
    }

    // Initialize external refs and circular refs tracking
    if (!spec._externalRefs) {
      spec._externalRefs = []
    }
    if (!spec._circularRefs) {
      spec._circularRefs = []
    }

    // Validate and ensure it's OpenAPI 3.x or 3.1
    if (spec.openapi) {
      if (!spec.openapi.startsWith('3')) {
        return {
          success: false,
          error: 'Only OpenAPI 3.x is supported. Found version: ' + spec.openapi
        }
      }
    }

    if (spec.swagger) {
      return {
        success: false,
        error: 'Swagger 2.0 is not supported. Please use OpenAPI 3.x.'
      }
    }

    // Validate using @scalar/openapi-parser
    const validation = await validateOpenAPI(spec)
    if (!validation.valid) {
      // Limit errors to first MAX_VALIDATION_ERRORS and show count
      const allErrors = Array.isArray(validation.errors) ? validation.errors : []
      const displayErrors = allErrors.slice(0, MAX_VALIDATION_ERRORS)
      const errorMessages = displayErrors.map(e => `- ${e.message || e}`).join('\n')
      const errorCount = allErrors.length
      const countMessage = errorCount > MAX_VALIDATION_ERRORS
        ? `\n(Showing ${MAX_VALIDATION_ERRORS} of ${errorCount} errors)`
        : ''

      return {
        success: false,
        error: `Invalid OpenAPI spec:\n${errorMessages}${countMessage}`
      }
    }

    // Ensure validation.spec exists and is an object
    const validatedSpec = validation.spec && typeof validation.spec === 'object' ? validation.spec : spec

    // Check for relative server URLs - add warning but allow import
    const serverInfo = getServerUrl(validatedSpec.servers?.[0]) || { url: '', isRelative: false }
    const { url: serverUrl, isRelative } = serverInfo

    // Import the validated spec
    const result = importOpenAPISpec(validatedSpec)

    // Add warnings about relative URLs, external refs, and circular refs
    const warnings = []
    if (isRelative || !serverUrl) {
      warnings.push(`Server URL is relative (${serverUrl || '/path'}). You may need to update the base URL in requests to match your API server.`)
    }
    const externalRefs = validation.spec._externalRefs
    if (Array.isArray(externalRefs) && externalRefs.length > 0) {
      warnings.push(`Found ${externalRefs.length} external $ref(s) that could not be resolved. These may need to be resolved manually.`)
    }
    const circularRefs = validation.spec._circularRefs
    if (Array.isArray(circularRefs) && circularRefs.length > 0) {
      warnings.push(`Skipped ${circularRefs.length} circular reference(s) during example generation.`)
    }

    // Ensure result is a plain object before spreading
    const resultObj = result && typeof result === 'object' ? result : { requests: [], folders: [], collectionName: 'Import' }

    return {
      success: true,
      ...resultObj,
      warnings
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Invalid OpenAPI format'
    }
  }
}

/**
 * Converts Gostman requests to OpenAPI 3.0/3.1 specification
 * @param {Array} requests - Gostman request objects
 * @param {Object} options - Export options
 * @returns {Object} OpenAPI 3.0 specification
 */
export function exportToOpenAPI(requests, options = {}) {
  // Validate requests is an array
  if (!Array.isArray(requests)) {
    requests = []
  }

  const {
    title = 'Gostman API Collection',
    version = '1.0.0',
    description = 'API collection exported from Gostman',
    baseUrl = '',
    openApiVersion = '3.0.3'
  } = options

  const spec = {
    openapi: openApiVersion,
    info: {
      title,
      version,
      description
    },
    servers: baseUrl ? [{ url: baseUrl }] : [],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {}
    }
  }

  // Helper to infer type from value
  const inferType = (val) => {
    if (Array.isArray(val)) return 'array'
    if (typeof val === 'boolean') return 'boolean'
    if (typeof val === 'number') return 'number'
    return 'string'
  }

  // Helper to convert headers to lowercase for case-insensitive comparison
  const normalizeHeaders = (headers) => {
    const normalized = {}
    Object.entries(headers).forEach(([key, value]) => {
      normalized[key.toLowerCase()] = { key, value }
    })
    return normalized
  }

  // Group requests by path and method
  const pathsMap = new Map()

  requests.forEach(request => {
    if (!request.url) return

    // Validate method early - also handle GRAPHQL
    const method = (request.method || 'GET').toLowerCase()
    const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace']
    if (!validMethods.includes(method)) {
      // Skip unknown methods (like GRAPHQL) but could log a warning
      return
    }

    // Parse URL to extract path
    let path = request.url
    try {
      const urlObj = new URL(request.url)
      path = urlObj.pathname

      // Always check for duplicate server URLs
      if (urlObj.origin) {
        const existingServer = spec.servers.find(s => s.url === urlObj.origin)
        if (!existingServer) {
          spec.servers.push({ url: urlObj.origin })
        }
      }
    } catch {
      // If URL is not absolute, use as-is
      path = path.startsWith('/') ? path : '/' + path
    }

    // Ensure path starts with / and normalize duplicate slashes
    path = path.startsWith('/') ? path : '/' + path
    path = path.replace(/\/+/g, '/')

    // Normalize path parameters (e.g., :id to {id}, {{id}} to {id})
    path = path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}')
    path = path.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, '{$1}')

    if (!pathsMap.has(path)) {
      pathsMap.set(path, {})
    }

    const pathObj = pathsMap.get(path)

    // Parse headers with case-insensitive access
    let headers = {}
    try {
      headers = JSON.parse(request.headers || '{}')
    } catch (err) {
      console.warn('Failed to parse headers for request:', request.name, err.message)
    }

    const normalizedHeaders = normalizeHeaders(headers)

    // Detect authentication from headers (case-insensitive)
    const authHeader = normalizedHeaders['authorization']
    if (authHeader) {
      const authValue = authHeader.value
      if (authValue.startsWith('Bearer ')) {
        spec.components.securitySchemes.bearerAuth = {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      } else if (authValue.startsWith('Basic ')) {
        spec.components.securitySchemes.basicAuth = {
          type: 'http',
          scheme: 'basic'
        }
      } else if (authValue.startsWith('ApiKey ')) {
        spec.components.securitySchemes.apiKeyAuth = {
          type: 'apiKey',
          in: 'header',
          name: authHeader.key
        }
      }
    }

    // Parse query params
    let queryParams = []
    try {
      const params = JSON.parse(request.queryParams || '{}')
      if (params && typeof params === 'object' && Object.keys(params).length > 0) {
        queryParams = Object.entries(params).map(([key, value]) => ({
          name: key,
          in: 'query',
          schema: { type: inferType(value), example: value },
          required: false
        }))
      }
    } catch (err) {
      console.warn('Failed to parse query params for request:', request.name, err.message)
    }

    // Extract path params from URL
    const pathParams = []
    const pathParamMatches = path.match(/\{([^}]+)\}/g)
    if (pathParamMatches) {
      pathParamMatches.forEach(match => {
        const paramName = match.slice(1, -1)
        if (!queryParams.find(p => p.name === paramName)) {
          pathParams.push({
            name: paramName,
            in: 'path',
            required: true,
            schema: { type: 'string' }
          })
        }
      })
    }

    // Build request body
    let requestBody = undefined
    if (request.body && request.body.trim()) {
      let contentType = 'application/json'
      const contentTypeHeader = normalizedHeaders['content-type']
      if (contentTypeHeader) {
        contentType = contentTypeHeader.value.split(';')[0].trim()
      }

      let bodySchema = { type: 'string' }
      let bodyExample = request.body

      if (contentType === 'application/json' || contentType === 'application/ld+json') {
        try {
          const parsed = JSON.parse(request.body)
          bodySchema = inferSchemaFromObject(parsed)
          bodyExample = parsed
        } catch (err) {
          console.warn('Failed to parse request body as JSON:', err.message)
        }
      }

      requestBody = {
        content: {
          [contentType]: {
            schema: bodySchema,
            example: bodyExample
          }
        }
      }
    }

    // Build the operation object
    const operation = {
      summary: request.name || `${method.toUpperCase()} ${path}`,
      description: request.description || `Request to ${path}`,
      parameters: [...queryParams, ...pathParams],
      ...(requestBody && { requestBody })
    }

    // Add responses based on common status codes
    operation.responses = {
      '200': {
        description: 'Successful response'
      },
      '400': {
        description: 'Bad request'
      },
      '500': {
        description: 'Server error'
      }
    }

    pathObj[method] = operation
  })

  spec.paths = Object.fromEntries(
    Array.from(pathsMap.entries()).map(([path, methods]) => [path, methods])
  )

  return spec
}

/**
 * Infers JSON Schema from a JavaScript object
 * @param {any} obj - Object to infer schema from
 * @param {WeakSet} seen - Set of already seen objects for circular reference detection
 * @returns {Object} JSON Schema
 */
function inferSchemaFromObject(obj, seen = new WeakSet()) {
  if (obj === null) return { type: 'null' }
  if (typeof obj === 'string') return { type: 'string' }
  if (typeof obj === 'number') return { type: 'number', format: Number.isInteger(obj) ? 'integer' : 'float' }
  if (typeof obj === 'boolean') return { type: 'boolean' }

  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      return {
        type: 'array',
        items: inferSchemaFromObject(obj[0], seen)
      }
    }
    return { type: 'array', items: {} }
  }

  if (typeof obj === 'object') {
    // Check for circular reference
    if (seen.has(obj)) {
      return { type: 'object', description: '[Circular reference]' }
    }
    seen.add(obj)

    const properties = {}
    const required = []

    Object.entries(obj).forEach(([key, value]) => {
      properties[key] = inferSchemaFromObject(value, seen)
      if (value !== null && value !== undefined && value !== '') {
        required.push(key)
      }
    })

    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required })
    }
  }

  return {}
}

/**
 * Validates and optionally dereferences an OpenAPI spec using @scalar/openapi-parser
 * @param {Object|string} spec - OpenAPI spec object or JSON string
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result with valid flag and errors
 */
export async function validateOpenAPI(spec, options = {}) {
  const { dereference: shouldDereference = false } = options

  try {
    if (typeof spec === 'string') {
      spec = JSON.parse(spec)
    }

    // Remove custom tracking properties that would cause validation errors
    // These are added by our import processing but shouldn't be in the spec
    const specCopy = { ...spec }
    delete specCopy._externalRefs
    delete specCopy._circularRefs

    // Basic structure validation
    if (!spec || typeof spec !== 'object') {
      return {
        valid: false,
        errors: [{ message: 'Spec must be an object' }]
      }
    }

    // Check for OpenAPI version
    if (!specCopy.openapi && !specCopy.swagger) {
      return {
        valid: false,
        errors: [{ message: 'Spec must have openapi or swagger field' }]
      }
    }

    if (shouldDereference) {
      const result = await dereference(specCopy)
      // @scalar/openapi-parser dereference returns { schema, errors }
      if (result.schema) {
        return {
          valid: true,
          spec: result.schema
        }
      }
      const errors = Array.isArray(result.errors) ? result.errors : []
      if (errors.length > 0) {
        return {
          valid: false,
          errors: errors.map(e => ({ message: e.message || String(e) }))
        }
      }
    }

    // Use validate for validation without dereferencing
    try {
      const result = await validate(specCopy)
      // @scalar/openapi-parser validate returns { valid, errors }
      if (result.valid) {
        return {
          valid: true,
          spec: spec  // Return original spec with tracking properties intact
        }
      }
      const errors = Array.isArray(result.errors) ? result.errors : []
      if (errors.length > 0) {
        // Limit errors to MAX_VALIDATION_ERRORS
        const limitedErrors = errors.slice(0, MAX_VALIDATION_ERRORS)
        return {
          valid: false,
          errors: limitedErrors.map(e => ({ message: e.message || String(e) }))
        }
      }
    } catch (validateError) {
      // If validate throws but basic structure is valid, accept it
      if (specCopy.openapi && specCopy.info && specCopy.paths) {
        return {
          valid: true,
          spec: spec  // Return original spec with tracking properties intact
        }
      }
      return {
        valid: false,
        errors: [{ message: validateError.message }]
      }
    }

    // Fallback - valid if basic structure is correct
    return {
      valid: true,
      spec: spec
    }
  } catch (error) {
    return {
      valid: false,
      errors: [{ message: error.message }]
    }
  }
}

/**
 * Converts Gostman requests to OpenAPI JSON string
 * @param {Array} requests - Gostman request objects
 * @param {Object} options - Export options
 * @returns {string} OpenAPI JSON string
 */
export function exportToOpenAPIJSON(requests, options = {}) {
  try {
    return safeStringify(exportToOpenAPI(requests, options))
  } catch (error) {
    console.warn('exportToOpenAPIJSON failed, falling back to standard stringify:', error.message)
    return JSON.stringify(exportToOpenAPI(requests, options), null, 2)
  }
}

/**
 * Converts Gostman requests to OpenAPI YAML string using js-yaml
 * @param {Array} requests - Gostman request objects
 * @param {Object} options - Export options
 * @returns {string} OpenAPI YAML string
 */
export function exportToOpenAPIYAML(requests, options = {}) {
  const spec = exportToOpenAPI(requests, options)
  return YAML.dump(spec, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  })
}

/**
 * Converts Gostman requests to Postman collection format (native, no SDK dependency)
 * @param {Array} requests - Gostman request objects
 * @param {Array} folders - Gostman folder objects
 * @param {Object} options - Export options
 * @returns {Object} Postman collection v2.1
 */
export function exportToPostman(requests, folders = [], options = {}) {
  // Validate inputs
  if (!Array.isArray(requests)) {
    requests = []
  }
  if (!Array.isArray(folders)) {
    folders = []
  }

  const {
    name = 'Gostman Collection',
    description = 'Collection exported from Gostman'
  } = options

  // Build folder map for quick lookup
  const folderMap = new Map()
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, items: [] })
  })

  // Group requests by folder
  const rootItems = []
  const folderRequests = new Map()

  requests.forEach(request => {
    const item = {
      name: request.name || 'Untitled Request',
      request: {
        method: request.method || 'GET',
        header: [],
        url: {
          raw: request.url || '',
          query: []
        },
        body: {
          mode: 'raw',
          raw: request.body || ''
        }
      },
      description: request.description || '',
      response: []
    }

    // Parse and add headers
    try {
      const headers = JSON.parse(request.headers || '{}')
      item.request.header = Object.entries(headers).map(([key, value]) => ({
        key,
        value: String(value),
        type: 'text'
      }))
    } catch (err) {
      console.warn('Failed to parse headers for Postman export:', err.message)
    }

    // Parse and add query parameters
    try {
      const params = JSON.parse(request.queryParams || '{}')
      if (params && typeof params === 'object') {
        item.request.url.query = Object.entries(params).map(([key, value]) => ({
          key,
          value: String(value)
        }))
      }
    } catch (err) {
      console.warn('Failed to parse query params for Postman export:', err.message)
    }

    // Set body mode based on content
    if (request.body && request.body.trim()) {
      const trimmed = request.body.trim()
      if (trimmed.startsWith('{')) {
        item.request.body.options = { raw: { language: 'json' } }
      }
    }

    // Add to appropriate folder or root
    if (request.folderId && folderMap.has(request.folderId)) {
      if (!folderRequests.has(request.folderId)) {
        folderRequests.set(request.folderId, [])
      }
      folderRequests.get(request.folderId).push(item)
    } else {
      rootItems.push(item)
    }
  })

  // Build the item hierarchy recursively
  const buildItemHierarchy = (folderId) => {
    const folder = folderMap.get(folderId)
    if (!folder) return []

    const items = []

    // Add requests in this folder
    const requestsInFolder = folderRequests.get(folderId) || []
    items.push(...requestsInFolder)

    // Find child folders and add them
    const childFolders = folders.filter(f => f.parentId === folderId)
    childFolders.forEach(childFolder => {
      items.push({
        name: childFolder.name,
        description: childFolder.description || '',
        item: buildItemHierarchy(childFolder.id)
      })
    })

    return items
  }

  // Start with root items
  const collectionItems = [...rootItems]

  // Add top-level folders (no parent)
  folders.filter(f => !f.parentId).forEach(folder => {
    const folderItems = folderRequests.get(folder.id) || []
    const hasChildFolders = folders.some(f => f.parentId === folder.id)
    if (folderItems.length > 0 || hasChildFolders) {
      collectionItems.push({
        name: folder.name,
        description: folder.description || '',
        item: buildItemHierarchy(folder.id)
      })
    }
  })

  return {
    info: {
      name,
      description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: collectionItems
  }
}

// Format version constant for Gostman exports
const GOSTMAN_FORMAT_VERSION = '1.0.0'

/**
 * Exports Gostman data to native JSON format for Git sync
 * @param {Array} requests - Gostman request objects
 * @param {Array} folders - Gostman folder objects
 * @param {Object} variables - Environment variables
 * @returns {Object} Gostman export data
 */
export function exportToGostman(requests, folders = [], variables = {}) {
  // Validate inputs
  if (!Array.isArray(requests)) {
    requests = []
  }
  if (!Array.isArray(folders)) {
    folders = []
  }
  if (typeof variables !== 'object' || variables === null) {
    variables = {}
  }

  return {
    version: GOSTMAN_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    gostman: {
      requests: requests.map(r => ({
        ...r,
        response: '' // Don't include responses in export
      })),
      folders,
      variables
    }
  }
}

/**
 * Imports Gostman native JSON format
 * @param {Object} data - Gostman export data
 * @returns {Object} Parsed result with success flag, requests, folders, and variables
 */
export function importGostman(data) {
  // Validate structure
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: 'Invalid Gostman export format: not an object'
    }
  }

  if (!data.gostman) {
    return {
      success: false,
      error: 'Invalid Gostman export format: missing gostman object'
    }
  }

  // Validate arrays
  if (!Array.isArray(data.gostman.requests)) {
    return {
      success: false,
      error: 'Invalid Gostman export format: requests must be an array'
    }
  }

  if (!Array.isArray(data.gostman.folders)) {
    return {
      success: false,
      error: 'Invalid Gostman export format: folders must be an array'
    }
  }

  // Validate variables is an object
  if (data.gostman.variables !== undefined && typeof data.gostman.variables !== 'object') {
    return {
      success: false,
      error: 'Invalid Gostman export format: variables must be an object'
    }
  }

  return {
    success: true,
    requests: data.gostman.requests || [],
    folders: data.gostman.folders || [],
    variables: data.gostman.variables || {}
  }
}

/**
 * Parses YAML string to object using js-yaml
 * @param {string} yamlString - YAML string
 * @returns {Object} Parsed object
 */
export function parseYAML(yamlString) {
  try {
    return YAML.load(yamlString)
  } catch (error) {
    throw new Error(`Invalid YAML: ${error.message}`)
  }
}

/**
 * Converts object to YAML string using js-yaml
 * @param {Object} obj - Object to convert
 * @param {Object} options - YAML dump options
 * @returns {string} YAML string
 */
export function toYAML(obj, options = {}) {
  const defaultOptions = {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false
  }
  return YAML.dump(obj, { ...defaultOptions, ...options })
}

/**
 * Generates Markdown documentation from requests
 * @param {Array} requests - Gostman request objects
 * @param {Object} options - Export options
 * @returns {string} Markdown documentation
 */
export function exportToMarkdown(requests, options = {}) {
  // Validate requests is an array
  if (!Array.isArray(requests)) {
    requests = []
  }

  const {
    title = 'API Documentation',
    description = 'Auto-generated documentation from Gostman',
    baseUrl = ''
  } = options

  let md = `# ${title}\n\n`

  if (description) {
    md += `${description}\n\n`
  }

  if (baseUrl) {
    md += `**Base URL:** \`${baseUrl}\`\n\n`
  }

  md += '---\n\n'

  // Group requests by folder/path
  const grouped = new Map()
  requests.forEach(request => {
    const group = request.folderId || 'root'
    if (!grouped.has(group)) {
      grouped.set(group, [])
    }
    grouped.get(group).push(request)
  })

  // Add Table of Contents
  md += '## Table of Contents\n\n'
  grouped.forEach((_, groupId) => {
    if (groupId !== 'root') {
      const anchor = groupId.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      md += `- [${groupId}](#${anchor})\n`
    }
  })
  md += '\n---\n\n'

  // Generate documentation for each group
  grouped.forEach((groupRequests, groupId) => {
    if (groupId !== 'root') {
      const anchor = groupId.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      md += `<a id="${anchor}"></a>\n`
      md += `## ${groupId}\n\n`
    }

    groupRequests.forEach(request => {
      const method = (request.method || 'GET').toUpperCase()

      // Method badge color
      const methodColors = {
        GET: '🟢',
        POST: '🔵',
        PUT: '🟠',
        DELETE: '🔴',
        PATCH: '🟡',
        HEAD: '🟣',
        OPTIONS: '🟣',
        GRAPHQL: '🩷'
      }

      md += `### ${request.name || 'Untitled Request'}\n\n`
      md += `${methodColors[method] || '⚪'} **${method}** \`${request.url || ''}\`\n\n`

      if (request.description) {
        md += `${request.description}\n\n`
      }

      // Headers
      try {
        const headers = JSON.parse(request.headers || '{}')
        if (Object.keys(headers).length > 0) {
          md += '**Headers:**\n\n'
          md += '| Key | Value |\n|-----|-------|\n'
          Object.entries(headers).forEach(([key, value]) => {
            const displayValue = String(value).length > MAX_TRUNCATION_LENGTH
              ? String(value).substring(0, MAX_TRUNCATION_LENGTH - 3) + '...'
              : String(value)
            md += `| \`${key}\` | \`${displayValue}\` |\n`
          })
          md += '\n'
        }
      } catch (err) {
        console.warn('Failed to parse headers for markdown export:', err.message)
      }

      // Query params
      try {
        const params = JSON.parse(request.queryParams || '{}')
        if (params && typeof params === 'object' && Object.keys(params).length > 0) {
          md += '**Query Parameters:**\n\n'
          md += '| Parameter | Type | Example |\n|-----------|------|---------|\n'
          Object.entries(params).forEach(([key, value]) => {
            const type = inferType(value)
            md += `| \`${key}\` | ${type} | \`${value}\` |\n`
          })
          md += '\n'
        }
      } catch (err) {
        console.warn('Failed to parse query params for markdown export:', err.message)
      }

      // Body
      if (request.body && request.body.trim()) {
        md += '**Request Body:**\n\n'
        md += '```json\n'
        md += request.body
        md += '\n```\n\n'
      }

      md += '---\n\n'
    })
  })

  return md
}

// Helper function to infer type (moved here for reuse)
function inferType(val) {
  if (Array.isArray(val)) return 'array'
  if (typeof val === 'boolean') return 'boolean'
  if (typeof val === 'number') return 'number'
  return 'string'
}

/**
 * Detects the format of imported data (JSON or YAML)
 * @param {string} jsonString - JSON or YAML string to detect
 * @returns {string} Format type: 'postman', 'openapi', 'gostman', or 'unknown'
 */
export function detectImportFormat(jsonString) {
  let data

  // Try JSON first
  try {
    data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString
  } catch {
    // Try YAML if JSON fails
    try {
      data = parseYAML(jsonString)
    } catch {
      return 'unknown'
    }
  }

  // Postman collection
  if (data.info?.schema?.includes('postman.com/json/collection') || data.info?._postman_id) {
    return 'postman'
  }

  // OpenAPI/Swagger
  if (data.openapi || (data.swagger && data.info)) {
    return 'openapi'
  }

  // Gostman
  if (data.gostman || (data.version && data.gostman)) {
    return 'gostman'
  }

  return 'unknown'
}

/**
 * Bundles an OpenAPI spec (resolves all $refs)
 * Note: @scalar/openapi-parser doesn't have a separate bundle function,
 * so we use dereference which has the same effect
 * @param {Object|string} spec - OpenAPI spec or file path
 * @returns {Promise<Object>} Bundled spec
 */
export async function bundleOpenAPI(spec) {
  const result = await dereference(spec)
  return result.schema || spec
}

/**
 * Dereferences an OpenAPI spec (inlines all $refs)
 * @param {Object|string} spec - OpenAPI spec or file path
 * @returns {Promise<Object>} Dereferenced spec
 */
export async function dereferenceOpenAPI(spec) {
  const result = await dereference(spec)
  return result.schema || spec
}
