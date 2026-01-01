/**
 * Import/Export utilities for Gostman
 * Supports Postman collections, OpenAPI specs, and Gostman's native format
 *
 * Uses official libraries for robust parsing:
 * - postman-collection: Official Postman SDK
 * - swagger-parser: OpenAPI validation
 * - js-yaml: YAML conversion
 */

import { Collection } from 'postman-collection'
import SwaggerParser from 'swagger-parser'
import YAML from 'js-yaml'

/**
 * Simple UUID generator (fallback)
 * @returns {string} A unique ID string
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Extract query parameters from a Postman Url object
 * @param {Object} urlObject - Postman Url object
 * @returns {Object} Query parameters as key-value pairs
 */
function extractQueryParams(urlObject) {
  const queryParams = {}

  if (urlObject.query && urlObject.query.count) {
    urlObject.query.each(param => {
      if (!param.disabled && param.key) {
        queryParams[param.key] = param.value || ''
      }
    })
  }

  return queryParams
}

/**
 * Extract headers from a Postman RequestHeaderList
 * @param {Object} headerList - Postman RequestHeaderList
 * @returns {Object} Headers as key-value pairs
 */
function extractHeaders(headerList) {
  const headers = {}

  if (headerList && headerList.count) {
    headerList.each(header => {
      if (!header.disabled && header.key) {
        headers[header.key] = header.value || ''
      }
    })
  }

  return headers
}

/**
 * Extract body from a Postman RequestBody
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
      if (requestBody.urlencoded) {
        requestBody.urlencoded.each(param => {
          if (!param.disabled && param.key) {
            formData[param.key] = param.value || ''
          }
        })
      }
      return JSON.stringify(formData, null, 2)

    case 'formdata':
      const form = {}
      if (requestBody.formdata) {
        requestBody.formdata.each(param => {
          if (!param.disabled && param.key) {
            form[param.key] = param.value || ''
          }
        })
      }
      return JSON.stringify(form, null, 2)

    case 'graphql':
      if (requestBody.graphql) {
        return requestBody.graphql.toString()
      }
      return ''

    default:
      return ''
  }
}

/**
 * Converts a Postman collection to Gostman requests using the official SDK
 * @param {Object|string} postmanCollection - Parsed Postman collection JSON or Collection instance
 * @returns {Object} Object with requests array, folders array, and collection name
 */
export function importPostmanCollection(postmanCollection) {
  const requests = []
  const folders = []

  // Use official Postman Collection SDK
  const collection = postmanCollection instanceof Collection
    ? postmanCollection
    : new Collection(postmanCollection)

  const collectionName = collection.name || 'Imported Collection'

  /**
   * Recursively process ItemGroups (folders) and Items (requests)
   * @param {Object} itemGroup - Postman ItemGroup
   * @param {string|null} parentFolderId - Parent folder ID for nested structures
   */
  function processItemGroup(itemGroup, parentFolderId = null) {
    itemGroup.each(item => {
      if (item.items) {
        // This is an ItemGroup (folder)
        const folderId = generateId()
        folders.push({
          id: folderId,
          name: item.name || item.id || 'Folder',
          isOpen: false,
          parentId: parentFolderId,
          description: item.description || ''
        })

        // Process nested items
        processItemGroup(item, folderId)
      } else {
        // This is an Item (request)
        const request = item.request

        if (!request) return

        // Get URL string
        const url = request.url?.toString() || ''

        // Extract query parameters
        let queryParams = {}
        if (request.url && request.url.query) {
          queryParams = extractQueryParams(request.url)
        }

        // Extract headers
        let headers = {}
        if (request.headers) {
          headers = extractHeaders(request.headers)
        }

        // Add auth headers if present
        if (request.auth && request.auth.parameters) {
          request.auth.parameters.each(param => {
            if (!param.disabled && param.key) {
              headers[param.key] = param.value || ''
            }
          })
        }

        // Extract body
        const body = extractBody(request.body)

        requests.push({
          id: item.id || generateId(),
          name: item.name || request.url?.getPath() || 'Untitled Request',
          url,
          method: request.method || 'GET',
          headers: JSON.stringify(headers, null, 2),
          body,
          queryParams: JSON.stringify(queryParams, null, 2),
          response: '',
          folderId: parentFolderId,
          description: item.description || request.description || '',
          createdAt: new Date().toISOString()
        })
      }
    })
  }

  // Start processing from collection's items
  processItemGroup(collection.items)

  return { requests, folders, collectionName }
}

/**
 * Parses a Postman collection JSON string using the official SDK
 * @param {string} jsonString - JSON string of Postman collection
 * @returns {Object} Parsed result with requests and folders
 */
export function parsePostmanCollection(jsonString) {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString

    // Validate using Postman SDK (will throw if invalid)
    const collection = new Collection(data)

    // Import using the validated collection
    const result = importPostmanCollection(collection)

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
 * Converts Gostman requests to OpenAPI 3.0 specification
 * @param {Array} requests - Gostman request objects
 * @param {Object} options - Export options
 * @returns {Object} OpenAPI 3.0 specification
 */
export function exportToOpenAPI(requests, options = {}) {
  const {
    title = 'Gostman API Collection',
    version = '1.0.0',
    description = 'API collection exported from Gostman',
    baseUrl = ''
  } = options

  const spec = {
    openapi: '3.0.3',
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

  // Group requests by path and method
  const pathsMap = new Map()

  requests.forEach(request => {
    if (!request.url) return

    // Parse URL to extract path
    let path = request.url
    try {
      const urlObj = new URL(request.url)
      path = urlObj.pathname

      // Add server if not present and we found one
      if (!baseUrl && urlObj.origin) {
        const existingServer = spec.servers.find(s => s.url === urlObj.origin)
        if (!existingServer) {
          spec.servers.push({ url: urlObj.origin })
        }
      }
    } catch {
      // If URL is not absolute, use as-is
      path = request.url.startsWith('/') ? request.url : '/' + request.url
    }

    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path
    }

    // Normalize path parameters (e.g., :id to {id})
    path = path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}')

    if (!pathsMap.has(path)) {
      pathsMap.set(path, {})
    }

    const pathObj = pathsMap.get(path)
    const method = (request.method || 'GET').toLowerCase()

    // Skip if method is invalid
    if (!['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'].includes(method)) {
      return
    }

    // Parse headers
    let headers = {}
    try {
      headers = JSON.parse(request.headers || '{}')
    } catch { }

    // Detect authentication from headers
    if (headers['Authorization'] || headers['authorization']) {
      const authValue = headers['Authorization'] || headers['authorization']
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
          name: 'Authorization'
        }
      }
    }

    // Parse query params
    let queryParams = []
    try {
      const params = JSON.parse(request.queryParams || '{}')
      queryParams = Object.entries(params).map(([key, value]) => ({
        name: key,
        in: 'query',
        schema: { type: typeof value === 'number' ? 'number' : 'string', example: value },
        required: false
      }))
    } catch { }

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
      if (headers['Content-Type']) {
        contentType = headers['Content-Type'].split(';')[0]
      }

      let bodySchema = { type: 'string' }
      let bodyExample = request.body

      if (contentType === 'application/json') {
        try {
          const parsed = JSON.parse(request.body)
          bodySchema = inferSchemaFromObject(parsed)
          bodyExample = parsed
        } catch { }
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
 * @returns {Object} JSON Schema
 */
function inferSchemaFromObject(obj) {
  if (obj === null) return { type: 'null' }
  if (typeof obj === 'string') return { type: 'string' }
  if (typeof obj === 'number') return { type: 'number' }
  if (typeof obj === 'boolean') return { type: 'boolean' }

  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      return {
        type: 'array',
        items: inferSchemaFromObject(obj[0])
      }
    }
    return { type: 'array', items: {} }
  }

  if (typeof obj === 'object') {
    const properties = {}
    const required = []

    Object.entries(obj).forEach(([key, value]) => {
      properties[key] = inferSchemaFromObject(value)
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
 * Validates and optionally dereferences an OpenAPI spec
 * @param {Object|string} spec - OpenAPI spec object or JSON string
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result with valid flag and errors
 */
export async function validateOpenAPI(spec, options = {}) {
  const { dereference = false } = options

  try {
    if (typeof spec === 'string') {
      spec = JSON.parse(spec)
    }

    if (dereference) {
      const dereferenced = await SwaggerParser.dereference(spec)
      return {
        valid: true,
        spec: dereferenced
      }
    }

    await SwaggerParser.validate(spec)
    return {
      valid: true,
      spec
    }
  } catch (error) {
    return {
      valid: false,
      errors: error.errors || [{ message: error.message }]
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
  return JSON.stringify(exportToOpenAPI(requests, options), null, 2)
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
    noRefs: true
  })
}

/**
 * Converts Gostman requests to Postman collection format using the SDK
 * @param {Array} requests - Gostman request objects
 * @param {Array} folders - Gostman folder objects
 * @param {Object} options - Export options
 * @returns {Object} Postman collection v2.1
 */
export function exportToPostman(requests, folders = [], options = {}) {
  const {
    name = 'Gostman Collection',
    description = 'Collection exported from Gostman'
  } = options

  // Use Postman SDK to create a proper collection
  const collection = new Collection({
    info: {
      name,
      description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: []
  })

  const folderMap = new Map()

  // Create folder structure first
  folders.forEach(folder => {
    const itemGroup = new Collection.ItemGroup({
      id: folder.id,
      name: folder.name,
      description: folder.description || ''
    })
    folderMap.set(folder.id, itemGroup)
  })

  // Group requests by folder
  const folderRequests = new Map()
  const rootRequests = []

  requests.forEach(request => {
    const postmanRequest = new Collection.Request({
      method: request.method || 'GET',
      header: [],
      body: {
        mode: 'raw',
        raw: request.body || ''
      }
    })

    // Set URL
    if (request.url) {
      postmanRequest.url = new Collection.Url(request.url)
    }

    // Add headers
    try {
      const headers = JSON.parse(request.headers || '{}')
      Object.entries(headers).forEach(([key, value]) => {
        postmanRequest.headers.add({
          key,
          value: String(value)
        })
      })
    } catch { }

    // Add query params
    try {
      const params = JSON.parse(request.queryParams || '{}')
      Object.entries(params).forEach(([key, value]) => {
        if (postmanRequest.url && postmanRequest.url.query) {
          postmanRequest.url.query.add({
            key,
            value: String(value)
          })
        }
      })
    } catch { }

    // Set body mode based on content
    if (request.body && request.body.trim()) {
      const trimmed = request.body.trim()
      if (trimmed.startsWith('{')) {
        postmanRequest.body = new Collection.RequestBody({
          mode: 'raw',
          raw: request.body,
          options: { raw: { language: 'json' } }
        })
      }
    }

    // Create item
    const item = new Collection.Item({
      name: request.name || 'Untitled Request',
      request: postmanRequest,
      description: request.description || ''
    })

    if (request.folderId && folderMap.has(request.folderId)) {
      if (!folderRequests.has(request.folderId)) {
        folderRequests.set(request.folderId, [])
      }
      folderRequests.get(request.folderId).push(item)
    } else {
      rootRequests.push(item)
    }
  })

  // Build collection structure
  // Add root requests
  rootRequests.forEach(item => collection.items.add(item))

  // Add folders with their requests
  folders.forEach(folder => {
    const folderItems = folderRequests.get(folder.id) || []
    if (folderItems.length > 0) {
      const itemGroup = new Collection.ItemGroup({
        name: folder.name,
        description: folder.description || ''
      })
      folderItems.forEach(item => itemGroup.items.add(item))
      collection.items.add(itemGroup)
    }
  })

  return collection.toJSON()
}

/**
 * Exports Gostman data to native JSON format for Git sync
 * @param {Array} requests - Gostman request objects
 * @param {Array} folders - Gostman folder objects
 * @param {Object} variables - Environment variables
 * @returns {Object} Gostman export data
 */
export function exportToGostman(requests, folders = [], variables = {}) {
  return {
    version: '1.0.0',
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
 * @returns {Object} Parsed result with requests, folders, and variables
 */
export function importGostman(data) {
  if (!data.gostman) {
    throw new Error('Invalid Gostman export format')
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
    noRefs: true
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
      const anchor = groupId.toLowerCase().replace(/\s+/g, '-')
      md += `- [${groupId}](#${anchor})\n`
    }
  })
  md += '\n---\n\n'

  // Generate documentation for each group
  grouped.forEach((groupRequests, groupId) => {
    if (groupId !== 'root') {
      const anchor = groupId.toLowerCase().replace(/\s+/g, '-')
      md += `<a id="${anchor}"></a>\n`
      md += `## ${groupId}\n\n`
    }

    groupRequests.forEach(request => {
      const method = (request.method || 'GET').toUpperCase()

      // Method badge color
      const methodColors = {
        GET: '🟢',
        POST: '🟢',
        PUT: '🟠',
        DELETE: '🔴',
        PATCH: '🟡',
        HEAD: '🟣',
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
            md += `| \`${key}\` | \`${String(value).substring(0, 50)}\` |\n`
          })
          md += '\n'
        }
      } catch { }

      // Query params
      try {
        const params = JSON.parse(request.queryParams || '{}')
        if (Object.keys(params).length > 0) {
          md += '**Query Parameters:**\n\n'
          md += '| Parameter | Type | Example |\n|-----------|------|---------|\n'
          Object.entries(params).forEach(([key, value]) => {
            const type = typeof value === 'number' ? 'number' : 'string'
            md += `| \`${key}\` | ${type} | \`${value}\` |\n`
          })
          md += '\n'
        }
      } catch { }

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

/**
 * Detects the format of imported data
 * @param {string} jsonString - JSON string to detect
 * @returns {string} Format type: 'postman', 'openapi', 'gostman', or 'unknown'
 */
export function detectImportFormat(jsonString) {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString

    // Postman collection
    if (data.info?.schema?.includes('postman.com/json/collection')) {
      return 'postman'
    }

    // OpenAPI/Swagger
    if (data.openapi || (data.swagger && data.info)) {
      return 'openapi'
    }

    // Gostman
    if (data.gostman || (data.version && data.requests)) {
      return 'gostman'
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Bundles an OpenAPI spec (resolves all $refs)
 * @param {Object|string} spec - OpenAPI spec or file path
 * @returns {Promise<Object>} Bundled spec
 */
export async function bundleOpenAPI(spec) {
  return await SwaggerParser.bundle(spec)
}

/**
 * Dereferences an OpenAPI spec (inlines all $refs)
 * @param {Object|string} spec - OpenAPI spec or file path
 * @returns {Promise<Object>} Dereferenced spec
 */
export async function dereferenceOpenAPI(spec) {
  return await SwaggerParser.dereference(spec)
}
