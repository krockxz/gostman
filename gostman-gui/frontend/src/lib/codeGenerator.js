/**
 * Generate code snippets for HTTP requests in various languages
 */

/**
 * Parse JSON safely, return empty object if invalid
 */
function safeParseJSON(jsonString) {
  if (!jsonString || jsonString.trim() === '') return {}
  try {
    return JSON.parse(jsonString)
  } catch (e) {
    return {}
  }
}

/**
 * Generate cURL command
 */
export function generateCurl(method, url, headers, body, queryParams) {
  const headersObj = safeParseJSON(headers)
  const bodyObj = safeParseJSON(body)
  const paramsObj = safeParseJSON(queryParams)

  let curl = `curl -X ${method}`

  // Build URL with query parameters
  let fullUrl = url
  if (Object.keys(paramsObj).length > 0) {
    const searchParams = new URLSearchParams()
    Object.entries(paramsObj).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    fullUrl += `?${searchParams.toString()}`
  }

  curl += ` "${fullUrl}"`

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
 * Generate JavaScript fetch code
 */
export function generateJavaScript(method, url, headers, body, queryParams) {
  const headersObj = safeParseJSON(headers)
  const bodyObj = safeParseJSON(body)
  const paramsObj = safeParseJSON(queryParams)

  // Build URL with query parameters
  let fullUrl = url
  if (Object.keys(paramsObj).length > 0) {
    const searchParams = new URLSearchParams()
    Object.entries(paramsObj).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    fullUrl += `?${searchParams.toString()}`
  }

  let code = `fetch("${fullUrl}", {\n`
  code += `  method: "${method}",\n`

  // Add headers
  if (Object.keys(headersObj).length > 0) {
    code += `  headers: {\n`
    Object.entries(headersObj).forEach(([key, value], index) => {
      code += `    "${key}": "${value}"${index < Object.entries(headersObj).length - 1 ? ',' : ''}\n`
    })
    code += `  }`
  }

  // Add body for methods that support it
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && Object.keys(bodyObj).length > 0) {
    if (Object.keys(headersObj).length > 0) code += ',\n'
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
 * Generate Python requests code
 */
export function generatePython(method, url, headers, body, queryParams) {
  const headersObj = safeParseJSON(headers)
  const bodyObj = safeParseJSON(body)
  const paramsObj = safeParseJSON(queryParams)

  let code = `import requests\n\n`
  code += `url = "${url}"\n`

  // Add query parameters
  if (Object.keys(paramsObj).length > 0) {
    code += `params = {\n`
    Object.entries(paramsObj).forEach(([key, value], index) => {
      const formattedValue = typeof value === 'string' ? `"${value}"` : value
      code += `    "${key}": ${formattedValue}${index < Object.entries(paramsObj).length - 1 ? ',' : ''}\n`
    })
    code += `}\n`
  }

  // Add headers
  if (Object.keys(headersObj).length > 0) {
    code += `headers = {\n`
    Object.entries(headersObj).forEach(([key, value], index) => {
      code += `    "${key}": "${value}"${index < Object.entries(headersObj).length - 1 ? ',' : ''}\n`
    })
    code += `}\n`
  }

  // Add body for methods that support it
  let bodyLine = ''
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && Object.keys(bodyObj).length > 0) {
    const bodyString = JSON.stringify(bodyObj, null, 2)
      .split('\n')
      .map((line, i) => i === 0 ? line : '    ' + line)
      .join('\n')
    bodyLine = `\ndata = ${bodyString}\n`
  }

  // Build request call
  code += `\nresponse = requests.${method.toLowerCase()}(`
  if (Object.keys(paramsObj).length > 0) code += 'url, params=params'
  else code += 'url'

  if (Object.keys(headersObj).length > 0) code += ', headers=headers'
  if (bodyLine) code += ', json=data'

  code += `)\n\n`
  code += `print(response.status_code)\n`
  code += `print(response.json())`

  return code
}

/**
 * Generate Go http.NewRequest code
 */
export function generateGo(method, url, headers, body, queryParams) {
  const headersObj = safeParseJSON(headers)
  const bodyObj = safeParseJSON(body)
  const paramsObj = safeParseJSON(queryParams)

  // Build URL with query parameters
  let fullUrl = url
  if (Object.keys(paramsObj).length > 0) {
    const searchParams = new URLSearchParams()
    Object.entries(paramsObj).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })
    fullUrl += `?${searchParams.toString()}`
  }

  let code = `package main\n\n`
  code += `import (\n`
  code += `    "bytes"\n`
  code += `    "encoding/json"\n`
  code += `    "fmt"\n`
  code += `    "io"\n`
  code += `    "net/http"\n`
  code += `)\n\n`

  code += `func main() {\n`

  // Add body for methods that support it
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && Object.keys(bodyObj).length > 0) {
    const bodyString = JSON.stringify(bodyObj, null, 4)
      .split('\n')
      .map((line) => '    ' + line)
      .join('\n')
    code += `    requestBody := map[string]interface{}${bodyString}\n`
    code += `    bodyBytes, _ := json.Marshal(requestBody)\n\n`
  }

  code += `    req, _ := http.NewRequest("${method}", "${fullUrl}"`

  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && Object.keys(bodyObj).length > 0) {
    code += `, bytes.NewBuffer(bodyBytes))\n\n`
  } else {
    code += `, nil)\n\n`
  }

  // Add headers
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
 * Get all code snippets
 */
export function generateAllSnippets(method, url, headers, body, queryParams) {
  return {
    curl: generateCurl(method, url, headers, body, queryParams),
    javascript: generateJavaScript(method, url, headers, body, queryParams),
    python: generatePython(method, url, headers, body, queryParams),
    go: generateGo(method, url, headers, body, queryParams),
  }
}
