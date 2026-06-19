import { substitute } from "./variables"

/**
 * Prepares the request data for fetching.
 * Handles GraphQL conversion, variable substitution, header parsing,
 * and URL construction with query params (overwrite semantics).
 *
 * Mirrors the desktop Go backend (app.go SendRequest) so web and
 * desktop behave identically.
 */
export function prepareRequest(activeRequest, variablesMap) {
    // Normalize method (uppercase + trim) — matches app.go:233
    let method = (activeRequest.method || "").trim().toUpperCase()

    let bodyStr = activeRequest.body || ""
    let headersStr = activeRequest.headers || "{}"
    let paramsStr = activeRequest.queryParams || "{}"
    let urlStr = activeRequest.url || ""

    // GraphQL handling — matches app.go:162-193
    if (method === "GRAPHQL") {
        method = "POST"
        const graphqlReq = { query: bodyStr }
        // Parse queryParams as the GraphQL variables object; omit on failure
        try {
            graphqlReq.variables = JSON.parse(paramsStr)
        } catch (e) {
            // omit variables
        }
        bodyStr = JSON.stringify(graphqlReq)

        // Default Content-Type: application/json if not already set (case-insensitive)
        try {
            const headers = JSON.parse(headersStr || "{}")
            const hasContentType = Object.keys(headers).some(
                (k) => k.toLowerCase() === "content-type"
            )
            if (!hasContentType) {
                headers["Content-Type"] = "application/json"
            }
            headersStr = JSON.stringify(headers)
        } catch (e) {
            console.error("Failed to parse headers for GraphQL", e)
        }
    }

    // Variable substitution — matches app.go:202-206
    urlStr = substitute(urlStr, variablesMap)
    headersStr = substitute(headersStr, variablesMap)
    paramsStr = substitute(paramsStr, variablesMap)
    bodyStr = substitute(bodyStr, variablesMap)

    // Parse headers
    let headersObj = {}
    try {
        headersObj = JSON.parse(headersStr || "{}")
    } catch (e) {
        throw new Error("Invalid headers format: " + e.message)
    }

    // Query params: overwrite existing URL keys (no duplicates, single
    // string values, sorted) — matches app.go:215-230 (url.Values.Set + Encode)
    let fetchUrl = urlStr
    try {
        const queryObj = JSON.parse(paramsStr || "{}")
        if (Object.keys(queryObj).length > 0) {
            const u = new URL(fetchUrl)
            const sp = u.searchParams
            for (const [key, value] of Object.entries(queryObj)) {
                sp.set(key, String(value))
            }
            sp.sort()
            u.search = sp.toString()
            fetchUrl = u.toString()
        }
    } catch (e) {
        console.error("Failed to parse query params", e)
    }

    // Body attachment for any method when non-empty — matches app.go:238-243
    return {
        url: fetchUrl,
        method,
        headers: headersObj,
        body: bodyStr !== "" ? bodyStr : undefined,
    }
}
