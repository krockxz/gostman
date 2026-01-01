/**
 * Utility functions for data parsing
 */

/** Parse JSON safely, return default value if invalid */
export function parseJSON(jsonString, defaultValue = {}) {
  if (!jsonString || jsonString.trim() === '') return defaultValue
  try {
    return JSON.parse(jsonString)
  } catch {
    return defaultValue
  }
}

/** Parse request from storage or API with fallback defaults */
export function parseRequest(rawRequest) {
  if (!rawRequest) {
    return {
      id: '',
      name: 'New Request',
      method: 'GET',
      url: '',
      headers: '{}',
      body: '',
      queryParams: '{}',
      response: ''
    }
  }
  return {
    id: rawRequest.id || '',
    name: rawRequest.name || 'New Request',
    method: rawRequest.method || 'GET',
    url: rawRequest.url || '',
    headers: rawRequest.headers || '{}',
    body: rawRequest.body || '',
    queryParams: rawRequest.queryParams || '{}',
    response: rawRequest.response || '',
    folderId: rawRequest.folderId,
  }
}
