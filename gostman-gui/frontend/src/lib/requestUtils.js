import { substitute } from "./variables"

/**
 * Prepares the request data for fetching.
 * Handles variable substitution, header parsing, and URL construction.
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
            const searchParams = new URLSearchParams()
            Object.entries(queryObj).forEach(([key, value]) => {
                searchParams.append(key, String(value))
            })
            fetchUrl += (fetchUrl.includes('?') ? '&' : '?') + searchParams.toString()
        }
    } catch (e) {
        console.error("Failed to parse query params", e)
    }

    return {
        url: fetchUrl,
        method: activeRequest.method,
        headers: headersObj,
        body: ["POST", "PUT", "PATCH"].includes(activeRequest.method) ? finalBody : undefined,
        // Return substituted values if needed for UI updates (though we usually keep user input)
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
