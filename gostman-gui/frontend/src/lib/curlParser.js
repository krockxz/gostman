import parseCurl from 'parse-curl'

export function parseCurlCommand(curlCommand) {
  if (!curlCommand || typeof curlCommand !== 'string') {
    return null
  }

  const trimmed = curlCommand.trim()
  if (!/^curl\s/i.test(trimmed)) {
    return null
  }

  try {
    const parsed = parseCurl(trimmed)
    if (!parsed) return null

    // Format body: try to parse as JSON for pretty printing
    const formatBody = (body) => {
      if (!body) return ''
      if (typeof body === 'object') return JSON.stringify(body, null, 2)
      try {
        return JSON.stringify(JSON.parse(body), null, 2)
      } catch {
        return body
      }
    }

    // Extract query params from URL
    const getQueryParams = (url) => {
      try {
        const params = {}
        new URL(url).searchParams.forEach((v, k) => params[k] = v)
        return params
      } catch {
        return {}
      }
    }

    return {
      method: parsed.method?.toUpperCase() || 'GET',
      url: parsed.url || '',
      headers: JSON.stringify(parsed.header || {}, null, 2),
      body: formatBody(parsed.body),
      queryParams: JSON.stringify(getQueryParams(parsed.url), null, 2),
    }
  } catch (error) {
    console.error('Failed to parse curl command:', error)
    return null
  }
}

export function isCurlCommand(text) {
  return text && typeof text === 'string' && /^curl\s/i.test(text.trim())
}
