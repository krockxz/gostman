/**
 * Tests for variable substitution
 * Run with: npm test -- variables.test.js
 */

import { describe, it, expect } from 'vitest'
import { substitute, parseVariables } from './variables'

describe('variables', () => {
  describe('substitute', () => {
    it('should replace basic variables', () => {
      const result = substitute('Hello {{name}}', { name: 'World' })
      expect(result).toBe('Hello World')
    })

    it('should replace multiple variables', () => {
      const result = substitute('{{greeting}} {{name}}', { greeting: 'Hello', name: 'World' })
      expect(result).toBe('Hello World')
    })

    it('should handle whitespace in braces', () => {
      const result = substitute('Hello {{ name }}', { name: 'World' })
      expect(result).toBe('Hello World')
    })

    it('should handle extra whitespace', () => {
      const result = substitute('Hello {{  name  }}', { name: 'World' })
      expect(result).toBe('Hello World')
    })

    it('should keep placeholder for missing variables', () => {
      const result = substitute('Hello {{missing}}', { other: 'value' })
      expect(result).toBe('Hello {{missing}}')
    })

    it('should substitute URLs', () => {
      const result = substitute('{{base_url}}/users/{{id}}', {
        base_url: 'https://api.example.com',
        id: '42'
      })
      expect(result).toBe('https://api.example.com/users/42')
    })

    it('should handle empty variables object', () => {
      const result = substitute('Hello {{name}}', {})
      expect(result).toBe('Hello {{name}}')
    })

    it('should handle null variables', () => {
      const result = substitute('Hello {{name}}', null)
      expect(result).toBe('Hello {{name}}')
    })

    it('should handle undefined variables', () => {
      const result = substitute('Hello {{name}}', undefined)
      expect(result).toBe('Hello {{name}}')
    })

    it('should handle null input', () => {
      expect(substitute(null, {})).toBe(null)
    })

    it('should handle undefined input', () => {
      expect(substitute(undefined, {})).toBe(undefined)
    })

    it('should handle non-string input', () => {
      expect(substitute(123, {})).toBe(123)
      expect(substitute(true, {})).toBe(true)
    })

    it('should handle empty string input', () => {
      expect(substitute('', {})).toBe('')
    })

    it('should replace all occurrences of the same variable', () => {
      const result = substitute('{{name}} is {{name}}', { name: 'test' })
      expect(result).toBe('test is test')
    })

    it('should handle variables with underscores', () => {
      const result = substitute('{{api_key}}', { api_key: 'secret' })
      expect(result).toBe('secret')
    })

    it('should handle variables with hyphens', () => {
      const result = substitute('{{api-key}}', { 'api-key': 'secret' })
      expect(result).toBe('secret')
    })

    it('should handle variables with numbers', () => {
      const result = substitute('{{var1}}', { var1: 'value' })
      expect(result).toBe('value')
    })

    it('should handle complex nested JSON strings', () => {
      const result = substitute('{"url": "{{base_url}}", "key": "{{api_key}}"}', {
        base_url: 'https://api.example.com',
        api_key: 'secret'
      })
      expect(result).toBe('{"url": "https://api.example.com", "key": "secret"}')
    })

    it('should handle special characters in values', () => {
      const result = substitute('{{value}}', { value: 'a/b/c?d=e&f=g' })
      expect(result).toBe('a/b/c?d=e&f=g')
    })

    it('should handle empty string values', () => {
      const result = substitute('{{name}}', { name: '' })
      expect(result).toBe('')
    })

    it('should handle numeric values', () => {
      const result = substitute('{{port}}', { port: 8080 })
      expect(result).toBe(8080)
    })

    it('should handle boolean values', () => {
      const result = substitute('{{enabled}}', { enabled: true })
      expect(result).toBe(true)
    })

    it('should handle consecutive placeholders', () => {
      const result = substitute('{{a}}{{b}}', { a: '1', b: '2' })
      expect(result).toBe('12')
    })

    it('should handle placeholders without spaces between them', () => {
      const result = substitute('{{a}}/{{b}}', { a: 'api', b: 'v1' })
      expect(result).toBe('api/v1')
    })
  })

  describe('parseVariables', () => {
    it('should parse valid JSON', () => {
      const result = parseVariables('{"key": "value"}')
      expect(result).toEqual({ key: 'value' })
    })

    it('should parse JSON with multiple keys', () => {
      const result = parseVariables('{"key1": "value1", "key2": "value2"}')
      expect(result).toEqual({ key1: 'value1', key2: 'value2' })
    })

    it('should parse JSON with numbers', () => {
      const result = parseVariables('{"port": 8080}')
      expect(result).toEqual({ port: 8080 })
    })

    it('should parse JSON with booleans', () => {
      const result = parseVariables('{"enabled": true}')
      expect(result).toEqual({ enabled: true })
    })

    it('should parse JSON with null', () => {
      const result = parseVariables('{"value": null}')
      expect(result).toEqual({ value: null })
    })

    it('should parse nested JSON objects', () => {
      const result = parseVariables('{"config": {"debug": true}}')
      expect(result).toEqual({ config: { debug: true } })
    })

    it('should parse JSON arrays', () => {
      const result = parseVariables('{"items": [1, 2, 3]}')
      expect(result).toEqual({ items: [1, 2, 3] })
    })

    it('should return empty object for invalid JSON', () => {
      const result = parseVariables('{invalid}')
      expect(result).toEqual({})
    })

    it('should return empty object for empty string', () => {
      const result = parseVariables('')
      expect(result).toEqual({})
    })

    it('should return empty object for null input', () => {
      const result = parseVariables(null)
      expect(result).toEqual({})
    })

    it('should return empty object for undefined input', () => {
      const result = parseVariables(undefined)
      expect(result).toEqual({})
    })

    it('should handle malformed JSON', () => {
      expect(parseVariables('{')).toEqual({})
      expect(parseVariables('}')).toEqual({})
      expect(parseVariables('{"key": value}')).toEqual({})
    })

    it('should handle JSON with whitespace', () => {
      const result = parseVariables('  { "key" : "value" }  ')
      expect(result).toEqual({ key: 'value' })
    })
  })

  describe('integration: substitute with parseVariables', () => {
    it('should parse and substitute in a realistic scenario', () => {
      const jsonVars = '{"base_url": "https://api.example.com", "user_id": "12345"}'
      const vars = parseVariables(jsonVars)
      const url = substitute('{{base_url}}/users/{{user_id}}', vars)
      expect(url).toBe('https://api.example.com/users/12345')
    })

    it('should handle full request substitution', () => {
      const jsonVars = '{"host": "api.github.com", "token": "ghp_token", "user": "octocat"}'
      const vars = parseVariables(jsonVars)

      const url = substitute('https://{{host}}/users/{{user}}/repos', vars)
      expect(url).toBe('https://api.github.com/users/octocat/repos')

      const headers = substitute('{"Authorization": "Bearer {{token}}", "Accept": "application/json"}', vars)
      expect(headers).toBe('{"Authorization": "Bearer ghp_token", "Accept": "application/json"}')
    })
  })
})
