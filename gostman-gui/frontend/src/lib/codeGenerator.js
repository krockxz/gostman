/**
 * Generate code snippets for HTTP requests in various languages
 * Uses curlconverter library for multi-language code generation
 * Uses qs for query string handling
 */

import * as curlconverter from 'curlconverter'
import qs from 'qs'
import { parseJSON } from './dataUtils'

/**
 * Build URL with query parameters using qs
 */
function buildUrl(url, params) {
  if (Object.keys(params).length === 0) return url
  const queryString = qs.stringify(params, { arrayFormat: 'brackets' })
  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`
}

/**
 * Build a curl command from request components
 */
function buildCurlCommand(method, url, headers, body, queryParams) {
  const headersObj = parseJSON(headers)
  const bodyObj = parseJSON(body)
  const paramsObj = parseJSON(queryParams)

  const fullUrl = buildUrl(url, paramsObj)
  let curl = `curl -X ${method} "${fullUrl}"`

  // Add headers
  Object.entries(headersObj).forEach(([key, value]) => {
    curl += ` \\\n  -H "${key}: ${value}"`
  })

  // Add body for methods that support it
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && Object.keys(bodyObj).length > 0) {
    const bodyString = JSON.stringify(bodyObj, null, 2)
    curl += ` \\\n  -d '${bodyString}'`
  }

  return curl
}

/**
 * Generate cURL command
 */
export function generateCurl(method, url, headers, body, queryParams) {
  return buildCurlCommand(method, url, headers, body, queryParams)
}

/**
 * Generate JavaScript fetch code using curlconverter
 */
export function generateJavaScript(method, url, headers, body, queryParams) {
  const curl = buildCurlCommand(method, url, headers, body, queryParams)
  try {
    return curlconverter.toJavaScript(curl)
  } catch {
    // Fallback to manual generation if curlconverter fails
    return generateJavaScriptFallback(method, url, headers, body, queryParams)
  }
}

/**
 * Fallback JavaScript fetch generator
 */
function generateJavaScriptFallback(method, url, headers, body, queryParams) {
  const headersObj = parseJSON(headers)
  const bodyObj = parseJSON(body)
  const paramsObj = parseJSON(queryParams)

  const fullUrl = buildUrl(url, paramsObj)
  let code = `fetch("${fullUrl}", {\n`
  code += `  method: "${method}",\n`

  const hasHeaders = Object.keys(headersObj).length > 0
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && Object.keys(bodyObj).length > 0

  if (hasHeaders) {
    code += `  headers: {\n${formatHeaders(headersObj)}\n  }`
  }

  if (hasBody) {
    if (hasHeaders) code += ',\n'
    const bodyString = JSON.stringify(bodyObj, null, 2)
    code += `  body: JSON.stringify(${bodyString})\n`
  } else {
    code += '\n'
  }

  code += `})\n`
  code += `  .then(response => response.json())\n`
  code += `  .then(data => console.log(data))\n`
  code += `  .catch(error => console.error('Error:', error))`

  return code
}

/**
 * Format headers for code output
 */
function formatHeaders(headersObj) {
  return Object.entries(headersObj)
    .map(([key, value]) => `    "${key}": "${value}"`)
    .join(',\n')
}

/**
 * Generate Python requests code using curlconverter
 */
export function generatePython(method, url, headers, body, queryParams) {
  const curl = buildCurlCommand(method, url, headers, body, queryParams)
  try {
    return curlconverter.toPython(curl)
  } catch {
    return generatePythonFallback(method, url, headers, body, queryParams)
  }
}

/**
 * Fallback Python generator
 */
function generatePythonFallback(method, url, headers, body, queryParams) {
  const headersObj = parseJSON(headers)
  const bodyObj = parseJSON(body)
  const paramsObj = parseJSON(queryParams)

  let code = `import requests\n\n`
  code += `url = "${url}"\n`

  const hasParams = Object.keys(paramsObj).length > 0
  const hasHeaders = Object.keys(headersObj).length > 0
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && Object.keys(bodyObj).length > 0

  if (hasParams) {
    code += `params = {\n`
    Object.entries(paramsObj).forEach(([key, value], index) => {
      const formattedValue = typeof value === 'string' ? `"${value}"` : value
      code += `    "${key}": ${formattedValue}${index < Object.keys(paramsObj).length - 1 ? ',' : ''}\n`
    })
    code += `}\n`
  }

  if (hasHeaders) {
    code += `headers = {\n${formatHeaders(headersObj)}\n}\n`
  }

  if (hasBody) {
    const bodyString = JSON.stringify(bodyObj, null, 2)
      .split('\n')
      .map((line) => '    ' + line)
      .join('\n')
    code += `\ndata = ${bodyString}\n`
  }

  code += `\nresponse = requests.${method.toLowerCase()}(`
  code += hasParams ? 'url, params=params' : 'url'
  if (hasHeaders) code += ', headers=headers'
  if (hasBody) code += ', json=data'

  code += `)\n\n`
  code += `print(response.status_code)\n`
  code += `print(response.json())`

  return code
}

/**
 * Generate Go http.NewRequest code using curlconverter
 */
export function generateGo(method, url, headers, body, queryParams) {
  const curl = buildCurlCommand(method, url, headers, body, queryParams)
  try {
    return curlconverter.toGo(curl)
  } catch {
    return generateGoFallback(method, url, headers, body, queryParams)
  }
}

/**
 * Fallback Go generator
 */
function generateGoFallback(method, url, headers, body, queryParams) {
  const headersObj = parseJSON(headers)
  const bodyObj = parseJSON(body)
  const paramsObj = parseJSON(queryParams)

  const fullUrl = buildUrl(url, paramsObj)

  let code = `package main\n\n`
  code += `import (\n`
  code += `    "bytes"\n`
  code += `    "encoding/json"\n`
  code += `    "fmt"\n`
  code += `    "io"\n`
  code += `    "net/http"\n`
  code += `)\n\n`

  code += `func main() {`

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && Object.keys(bodyObj).length > 0

  if (hasBody) {
    const bodyString = JSON.stringify(bodyObj, null, 4)
      .split('\n')
      .map((line) => '    ' + line)
      .join('\n')
    code += `    requestBody := map[string]interface{}${bodyString}\n`
    code += `    bodyBytes, _ := json.Marshal(requestBody)\n\n`
  }

  code += `    req, _ := http.NewRequest("${method}", "${fullUrl}"`
  code += hasBody ? `, bytes.NewBuffer(bodyBytes))\n\n` : `, nil)\n\n`

  if (Object.keys(headersObj).length > 0) {
    Object.entries(headersObj).forEach(([key, value]) => {
      code += `    req.Header.Set("${key}", "${value}")\n`
    })
    code += `\n`
  }

  code += `    client := &http.Client{}\n`
  code += `    resp, _ := client.Do(req)\n`
  code += `    defer resp.Body.Close()\n\n`
  code += `    responseBody, _ := io.ReadAll(resp.Body)\n`
  code += `    fmt.Println(string(responseBody))\n`
  code += `}`

  return code
}

/**
 * Generate PHP code using curlconverter
 */
export function generatePhp(method, url, headers, body, queryParams) {
  const curl = buildCurlCommand(method, url, headers, body, queryParams)
  try {
    return curlconverter.toPhp(curl)
  } catch {
    // Return a simple fallback
    return `// PHP code generation not available\n// Curl command:\n${curl}`
  }
}

/**
 * Generate Java code using curlconverter
 */
export function generateJava(method, url, headers, body, queryParams) {
  const curl = buildCurlCommand(method, url, headers, body, queryParams)
  try {
    return curlconverter.toJava(curl)
  } catch {
    return `// Java code generation not available\n// Curl command:\n${curl}`
  }
}

/**
 * Get all code snippets
 * Now supports 8+ languages via curlconverter
 */
export function generateAllSnippets(method, url, headers, body, queryParams) {
  return {
    curl: generateCurl(method, url, headers, body, queryParams),
    javascript: generateJavaScript(method, url, headers, body, queryParams),
    python: generatePython(method, url, headers, body, queryParams),
    go: generateGo(method, url, headers, body, queryParams),
    php: generatePhp(method, url, headers, body, queryParams),
    java: generateJava(method, url, headers, body, queryParams),
  }
}
