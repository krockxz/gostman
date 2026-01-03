import { substitute } from "./variables"
import qs from 'qs'

/**
 * Prepares the request data for fetching.
 * Handles variable substitution, header parsing, and URL construction.
 * Uses qs for query string handling.
 */
export function prepareRequest(activeRequest, variablesMap) {
    const finalUrl = substitute(activeRequest.url, variablesMap)
    const finalQueryParams = substitute(activeRequest.queryParams, variablesMap)
    const finalHeaders = substitute(activeRequest.headers, variablesMap)
    const finalBody = substitute(activeRequest.body, variablesMap)

    let headersObj = {}
    try {
        headersObj = JSON.parse(finalHeaders || "{}")
    } catch (e) {
        console.error("Failed to parse headers", e)
    }

    let fetchUrl = finalUrl
    try {
        const queryObj = JSON.parse(finalQueryParams || "{}")
        if (Object.keys(queryObj).length > 0) {
            const queryString = qs.stringify(queryObj, { arrayFormat: 'brackets' })
            fetchUrl += (fetchUrl.includes('?') ? '&' : '?') + queryString
        }
    } catch (e) {
        console.error("Failed to parse query params", e)
    }

    return {
        url: fetchUrl,
        method: activeRequest.method,
        headers: headersObj,
        body: ["POST", "PUT", "PATCH"].includes(activeRequest.method) ? finalBody : undefined,
    }
}

/**
 * Processes the fetch response.
 * Handles different content types (blobs, text, html).
 */
export async function processResponse(response) {
    const contentType = response.headers.get("content-type") || ""
    let responseData = ""
    let responseType = "text"

    if (contentType.includes("image/")) {
        const blob = await response.blob()
        responseData = URL.createObjectURL(blob)
        responseType = "image"
    } else {
        responseData = await response.text()
        if (contentType.includes("text/html")) {
            responseType = "html"
        } else {
            responseType = "text"
        }
    }

    const responseHeaders = {}
    response.headers.forEach((value, key) => {
        responseHeaders[key] = value
    })

    return {
        response: responseData,
        responseHeaders,
        responseType,
        status: `${response.status} ${response.statusText}`
    }
}
