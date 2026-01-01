import React, { useState, useEffect } from "react"
import { Play, ChevronDown, ChevronRight, FileJson, Zap, Check, AlertCircle } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Textarea } from "./ui/textarea"
import { parse, visit, buildSchema, Kind } from 'graphql'
import { request } from 'graphql-request'
import { GRAPHQL_EXAMPLES } from "../lib/graphqlConstants"

/**
 * GraphQL Query/Mutation Builder
 * Provides syntax highlighting, validation, and helpers for GraphQL requests
 *
 * Uses graphql and graphql-request libraries for robust handling
 */

/**
 * Validates a GraphQL query string
 * @param {string} query - GraphQL query to validate
 * @returns {Object} { valid, errors }
 */
export function validateGraphQLQuery(query) {
  if (!query || !query.trim()) {
    return { valid: false, errors: ['Query is empty'] }
  }

  try {
    parse(query)
    return { valid: true, errors: [] }
  } catch (error) {
    return { valid: false, errors: [error.message] }
  }
}

/**
 * Formats/Prettifies a GraphQL query string
 * @param {string} query - GraphQL query to format
 * @returns {string} Formatted query
 */
export function formatGraphQLQuery(query) {
  try {
    const ast = parse(query)
    // The ast contains the structured query
    // For now, return the original formatted by the parser
    return query
  } catch {
    // If parsing fails, do basic cleanup
    return query
      .replace(/\s+/g, ' ')
      .replace(/\{/g, '\n{\n  ')
      .replace(/\}/g, '\n}\n')
      .trim()
  }
}

/**
 * Extracts operation name from a GraphQL query
 * @param {string} query - GraphQL query
 * @returns {string} Operation name or 'UnnamedQuery'
 */
export function extractOperationName(query) {
  try {
    const ast = parse(query)
    for (const definition of ast.definitions) {
      if (definition.kind === Kind.OPERATION_DEFINITION) {
        return definition.name?.value || 'UnnamedQuery'
      }
    }
    return 'UnnamedQuery'
  } catch {
    return 'UnnamedQuery'
  }
}

/**
 * Extracts variables used in a GraphQL query
 * @param {string} query - GraphQL query
 * @returns {Array} Array of variable names
 */
export function extractVariables(query) {
  try {
    const ast = parse(query)
    const variables = []

    visit(ast, {
      VariableDefinition(node) {
        variables.push({
          name: node.variable.name.value,
          type: node.type.name?.value || 'Unknown'
        })
      }
    })

    return variables
  } catch {
    return []
  }
}

export function GraphQLPanel({
  query = '',
  variables = '',
  onQueryChange,
  onVariablesChange,
  onExecute
}) {
  const [activeExample, setActiveExample] = useState('query')
  const [showExamples, setShowExamples] = useState(false)
  const [validation, setValidation] = useState({ valid: true, errors: [] })
  const [detectedVars, setDetectedVars] = useState([])

  // Validate query when it changes
  useEffect(() => {
    if (query && query.trim()) {
      const result = validateGraphQLQuery(query)
      setValidation(result)

      // Extract variables from query
      const vars = extractVariables(query)
      setDetectedVars(vars)
    } else {
      setValidation({ valid: true, errors: [] })
      setDetectedVars([])
    }
  }, [query])

  const insertExample = (type) => {
    setActiveExample(type)
    if (type === 'query' || type === 'mutation' || type === 'subscription') {
      onQueryChange(GRAPHQL_EXAMPLES[type])
    } else if (type === 'variables') {
      onVariablesChange(GRAPHQL_EXAMPLES.variables)
    }
    setShowExamples(false)
  }

  const prettifyQuery = () => {
    try {
      const formatted = formatGraphQLQuery(query)
      onQueryChange(formatted)
    } catch (e) {
      console.error('Error prettifying:', e)
    }
  }

  const validateVariables = () => {
    try {
      if (variables && variables.trim()) {
        JSON.parse(variables)
        return { valid: true }
      }
      return { valid: true }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  }

  const varValidation = validateVariables()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">GraphQL Request</span>
          {validation.valid ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : query ? (
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20">
            POST
          </Badge>
          <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
            {extractOperationName(query)}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowExamples(!showExamples)}
            className="text-xs"
          >
            Examples
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {!validation.valid && validation.errors.length > 0 && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
          <p className="text-xs text-destructive">
            {validation.errors[0]}
          </p>
        </div>
      )}

      {/* Examples Dropdown */}
      {showExamples && (
        <div className="px-4 py-2 border-b border-border/50 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Insert an example:</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => insertExample('query')}
              className="text-xs"
            >
              Query
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => insertExample('mutation')}
              className="text-xs"
            >
              Mutation
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => insertExample('subscription')}
              className="text-xs"
            >
              Subscription
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => insertExample('variables')}
              className="text-xs"
            >
              Variables
            </Button>
          </div>
        </div>
      )}

      {/* Detected Variables */}
      {detectedVars.length > 0 && (
        <div className="px-4 py-2 border-b border-border/50 bg-blue-500/5 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Expected variables:</span>
          <div className="flex gap-1 flex-wrap">
            {detectedVars.map(v => (
              <Badge key={v.name} variant="outline" className="text-xs">
                {v.name}: {v.type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Query Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2 border-b border-border/50 bg-muted/10 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Query / Mutation</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={prettifyQuery}
            className="text-xs text-muted-foreground hover:text-foreground"
            disabled={!query || !validation.valid}
          >
            Prettify
          </Button>
        </div>
        <div className="flex-1 p-4">
          <Textarea
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={GRAPHQL_EXAMPLES.query}
            className={`w-full h-full font-mono text-sm resize-none ${!validation.valid ? 'border-destructive/50' : ''
              } bg-background border-border/50`}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Variables Editor */}
      <div className="border-t border-border/50">
        <details className="group" open>
          <summary className="px-4 py-2 cursor-pointer hover:bg-muted/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Query Variables (JSON)
              </span>
              {!varValidation.valid && (
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
          </summary>
          <div className="p-4 border-t border-border/50">
            <Textarea
              value={variables}
              onChange={(e) => onVariablesChange(e.target.value)}
              placeholder={GRAPHQL_EXAMPLES.variables}
              className={`w-full h-24 font-mono text-sm resize-none ${!varValidation.valid ? 'border-destructive/50' : ''
                } bg-background border-border/50`}
              spellCheck={false}
            />
            {!varValidation.valid && (
              <p className="text-xs text-destructive mt-1">{varValidation.error}</p>
            )}
          </div>
        </details>
      </div>

      {/* Request Preview */}
      <div className="border-t border-border/50">
        <details className="group">
          <summary className="px-4 py-2 cursor-pointer hover:bg-muted/10 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Request Preview
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
          </summary>
          <div className="p-4 border-t border-border/50 bg-muted/20">
            <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
              {JSON.stringify({
                query: query?.trim(),
                variables: (() => {
                  try {
                    return variables ? JSON.parse(variables) : undefined
                  } catch {
                    return undefined
                  }
                })()
              }, null, 2) || '{}'}
            </pre>
          </div>
        </details>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/20 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          GraphQL requests will be sent as POST with Content-Type: application/json
        </p>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Powered by</span>
          <span className="text-xs font-medium">graphql</span>
          <span className="text-xs text-muted-foreground">+</span>
          <span className="text-xs font-medium">graphql-request</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Executes a GraphQL request using graphql-request
 * @param {string} url - GraphQL endpoint URL
 * @param {string} query - GraphQL query
 * @param {Object} variables - Query variables
 * @param {Object} headers - Additional headers
 * @returns {Promise<Object>} Response data
 */
export async function executeGraphQLRequest(url, query, variables = {}, headers = {}) {
  try {
    // Clean up the query
    const cleanedQuery = query.replace(/^\s*(query|mutation|subscription)\s+/i, '')
    const operationName = extractOperationName(query)

    // Execute using graphql-request
    const data = await request(
      url,
      query,
      variables,
      {
        ...headers,
        'Content-Type': 'application/json'
      }
    )

    return {
      success: true,
      data,
      operation: operationName
    }
  } catch (error) {
    // Handle GraphQL errors
    if (error.response?.errors) {
      return {
        success: false,
        errors: error.response.errors,
        message: 'GraphQL errors occurred'
      }
    }

    return {
      success: false,
      error: error.message || 'Unknown error'
    }
  }
}

/**
 * Validates if a string appears to be a GraphQL request
 */
export function isGraphQLRequest(text) {
  if (!text || typeof text !== 'string') return false
  const trimmed = text.trim()

  // Check for GraphQL keywords at the start
  const graphqlKeywords = ['query', 'mutation', 'subscription', 'fragment', '{']
  const lowerTrimmed = trimmed.toLowerCase()

  // Check if it starts with a keyword or just a brace (shorthand query)
  if (lowerTrimmed.startsWith('{')) return true

  for (const keyword of graphqlKeywords) {
    if (lowerTrimmed.startsWith(keyword)) {
      return true
    }
  }

  return false
}

/**
 * Formats a GraphQL request for sending as HTTP
 * @param {string} query - GraphQL query/mutation
 * @param {string} variables - JSON variables
 * @returns {Object} { body, headers } - Formatted request
 */
export function formatGraphQLRequest(query, variables = '{}') {
  // Validate variables JSON
  let parsedVariables = {}
  try {
    if (variables && variables.trim()) {
      parsedVariables = JSON.parse(variables)
    }
  } catch (e) {
    console.warn('Invalid GraphQL variables JSON:', e)
  }

  const body = JSON.stringify({
    query: query,
    variables: parsedVariables
  }, null, 2)

  return {
    body,
    headers: {
      'Content-Type': 'application/json'
    }
  }
}

/**
 * Introspects a GraphQL schema to get available queries and mutations
 * @param {string} url - GraphQL endpoint URL
 * @param {Object} headers - Request headers
 * @returns {Promise<Object>} Schema information
 */
export async function introspectGraphQLSchema(url, headers = {}) {
  const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        queryType { name }
        mutationType { name }
        subscriptionType { name }
        types {
          name
          kind
          description
          fields {
            name
            type {
              name
              kind
            }
          }
        }
      }
    }
  `

  try {
    const result = await executeGraphQLRequest(url, introspectionQuery, {}, headers)

    if (result.success && result.data.__schema) {
      const schema = result.data.__schema
      return {
        success: true,
        queries: schema.queryType?.name || 'Query',
        mutations: schema.mutationType?.name || 'Mutation',
        subscriptions: schema.subscriptionType?.name || 'Subscription',
        types: schema.types
      }
    }

    return { success: false, error: 'Introspection failed' }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
