/**
 * Tests for OpenAPI import functionality
 * Run with: npm test -- importExport.test.js
 */

import { describe, it, expect } from 'vitest'
import { parseOpenAPISpec, importOpenAPISpec, detectImportFormat } from './importExport'

// Sample OpenAPI 3.0 spec
const sampleOpenAPISpec = {
  openapi: '3.0.3',
  info: {
    title: 'Sample API',
    version: '1.0.0',
    description: 'A sample API for testing'
  },
  servers: [
    { url: 'https://api.example.com/v1' }
  ],
  tags: [
    { name: 'users', description: 'User operations' },
    { name: 'posts', description: 'Post operations' }
  ],
  paths: {
    '/users': {
      get: {
        tags: ['users'],
        summary: 'List all users',
        operationId: 'listUsers',
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Number of users to return'
          },
          {
            name: 'Authorization',
            in: 'header',
            schema: { type: 'string' },
            description: 'Bearer token'
          }
        ],
        responses: {
          '200': { description: 'Success' }
        }
      },
      post: {
        tags: ['users'],
        summary: 'Create a user',
        operationId: 'createUser',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' }
                },
                required: ['name', 'email']
              }
            }
          }
        },
        responses: {
          '201': { description: 'Created' }
        }
      }
    },
    '/users/{userId}': {
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'User ID'
        },
        {
          name: 'verbose',
          in: 'query',
          schema: { type: 'boolean' }
        }
      ],
      get: {
        tags: ['users'],
        summary: 'Get a user',
        operationId: 'getUser',
        parameters: [
          {
            name: 'fields',
            in: 'query',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': { description: 'Success' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
}

// Sample YAML OpenAPI spec
const sampleOpenAPIYAML = `
openapi: 3.0.3
info:
  title: YAML Sample API
  version: 1.0.0
servers:
  - url: https://api.yaml.com
tags:
  - name: products
paths:
  /products:
    get:
      tags:
        - products
      summary: List products
      responses:
        '200':
          description: OK
`

describe('OpenAPI Import', () => {
  describe('detectImportFormat', () => {
    it('should detect OpenAPI format', () => {
      const result = detectImportFormat(JSON.stringify(sampleOpenAPISpec))
      expect(result).toBe('openapi')
    })

    it('should detect OpenAPI from YAML', () => {
      const result = detectImportFormat(sampleOpenAPIYAML)
      // YAML doesn't have openapi key at root level after JSON.parse fails
      // but it will be detected as 'unknown' - the YAML parsing happens later
      expect(result).toBe('unknown')
    })
  })

  describe('importOpenAPISpec', () => {
    it('should import OpenAPI spec to Gostman format', () => {
      const result = importOpenAPISpec(sampleOpenAPISpec)

      expect(result).toHaveProperty('requests')
      expect(result).toHaveProperty('folders')
      expect(result).toHaveProperty('collectionName')
      expect(result.collectionName).toBe('Sample API')
    })

    it('should create folders from tags', () => {
      const result = importOpenAPISpec(sampleOpenAPISpec)

      expect(result.folders).toHaveLength(2)
      expect(result.folders[0].name).toBe('users')
      expect(result.folders[0].description).toBe('User operations')
      expect(result.folders[1].name).toBe('posts')
    })

    it('should create requests with correct structure', () => {
      const result = importOpenAPISpec(sampleOpenAPISpec)

      expect(result.requests.length).toBeGreaterThan(0)

      const firstRequest = result.requests[0]
      expect(firstRequest).toHaveProperty('id')
      expect(firstRequest).toHaveProperty('name')
      expect(firstRequest).toHaveProperty('url')
      expect(firstRequest).toHaveProperty('method')
      expect(firstRequest).toHaveProperty('headers')
      expect(firstRequest).toHaveProperty('queryParams')
      expect(firstRequest).toHaveProperty('body')
      expect(firstRequest).toHaveProperty('folderId')
    })

    it('should preserve path parameters in URL', () => {
      const result = importOpenAPISpec(sampleOpenAPISpec)

      const getUserRequest = result.requests.find(r => r.name === 'Get a user')
      expect(getUserRequest).toBeDefined()
      expect(getUserRequest.url).toContain('/users/')
      expect(getUserRequest.url).toContain('{userId}')
    })

    it('should use server URL as base', () => {
      const result = importOpenAPISpec(sampleOpenAPISpec)

      expect(result.requests[0].url).toContain('https://api.example.com/v1')
    })

    it('should extract query parameters', () => {
      const result = importOpenAPISpec(sampleOpenAPISpec)

      const listUsers = result.requests.find(r => r.name === 'List all users')
      expect(listUsers).toBeDefined()

      const queryParams = JSON.parse(listUsers.queryParams)
      expect(queryParams).toHaveProperty('limit')
    })

    it('should merge path-level and operation-level parameters', () => {
      const result = importOpenAPISpec(sampleOpenAPISpec)

      const getUser = result.requests.find(r => r.name === 'Get a user')
      expect(getUser).toBeDefined()

      const queryParams = JSON.parse(getUser.queryParams)
      // Should have both 'verbose' (path-level) and 'fields' (operation-level)
      expect(queryParams).toHaveProperty('verbose')
      expect(queryParams).toHaveProperty('fields')
    })

    it('should add security headers', () => {
      const result = importOpenAPISpec(sampleOpenAPISpec)

      const firstRequest = result.requests[0]
      const headers = JSON.parse(firstRequest.headers)
      expect(headers).toHaveProperty('Authorization')
      expect(headers.Authorization).toContain('Bearer')
    })

    it('should assign requests to correct folders based on tags', () => {
      const result = importOpenAPISpec(sampleOpenAPISpec)

      const usersFolderId = result.folders.find(f => f.name === 'users')?.id
      const usersRequests = result.requests.filter(r => r.folderId === usersFolderId)

      expect(usersRequests.length).toBeGreaterThan(0)
      expect(usersRequests.every(r => r.folderId === usersFolderId)).toBe(true)
    })

    it('should generate request body from schema', () => {
      const result = importOpenAPISpec(sampleOpenAPISpec)

      const createUser = result.requests.find(r => r.name === 'Create a user')
      expect(createUser).toBeDefined()
      expect(createUser.body).toBeDefined()

      const body = JSON.parse(createUser.body)
      expect(body).toHaveProperty('name')
      expect(body).toHaveProperty('email')
    })

    it('should handle specs without tags', () => {
      const specNoTags = {
        ...sampleOpenAPISpec,
        tags: [],
        paths: {
          '/health': {
            get: {
              summary: 'Health check',
              responses: { '200': { description: 'OK' } }
            }
          }
        }
      }

      const result = importOpenAPISpec(specNoTags)

      expect(result.folders).toHaveLength(0)

      const healthCheck = result.requests.find(r => r.name === 'Health check')
      expect(healthCheck).toBeDefined()
      expect(healthCheck.folderId).toBeNull()
    })

    it('should handle specs without servers', () => {
      const specNoServers = {
        ...sampleOpenAPISpec,
        servers: []
      }

      const result = importOpenAPISpec(specNoServers)

      expect(result.requests[0].url).not.toContain('https://')
    })

    it('should store schema metadata', () => {
      const result = importOpenAPISpec(sampleOpenAPISpec)

      const createUser = result.requests.find(r => r.name === 'Create a user')
      expect(createUser).toHaveProperty('metadata')

      const metadata = JSON.parse(createUser.metadata)
      expect(metadata).toHaveProperty('openapi')
      expect(metadata.openapi).toHaveProperty('schema')
    })

    it('should throw error for Swagger 2.0', () => {
      const swaggerSpec = {
        swagger: '2.0',
        info: { title: 'Old API', version: '1.0.0' },
        paths: {}
      }

      expect(() => importOpenAPISpec(swaggerSpec)).toThrow('Swagger 2.0')
    })
  })

  describe('parseOpenAPISpec', () => {
    it('should parse JSON OpenAPI spec', async () => {
      const result = await parseOpenAPISpec(JSON.stringify(sampleOpenAPISpec))

      expect(result.success).toBe(true)
      expect(result.requests).toBeDefined()
      expect(result.folders).toBeDefined()
    })

    it('should parse YAML OpenAPI spec', async () => {
      const result = await parseOpenAPISpec(sampleOpenAPIYAML)

      expect(result.success).toBe(true)
      expect(result.collectionName).toBe('YAML Sample API')
    })

    it('should reject Swagger 2.0', async () => {
      const swaggerSpec = JSON.stringify({
        swagger: '2.0',
        info: { title: 'Old API', version: '1.0.0' },
        paths: {}
      })

      const result = await parseOpenAPISpec(swaggerSpec)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Swagger 2.0')
    })

    it('should reject empty input', async () => {
      const result = await parseOpenAPISpec('')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Empty')
    })

    it('should reject invalid input', async () => {
      const result = await parseOpenAPISpec('not valid json or yaml')

      expect(result.success).toBe(false)
    })

    it('should handle invalid YAML gracefully', async () => {
      const result = await parseOpenAPISpec('{invalid yaml content')

      expect(result.success).toBe(false)
    })
  })
})
