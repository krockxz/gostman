export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "GRAPHQL"]

// Simplified to 3 semantic colors: safe (green), warning (amber), error (red)
// GET/HEAD: safe (read operations)
// POST/PATCH/PUT: warning (write operations)
// DELETE: error (destructive)
// GRAPHQL: neutral (cyan - brand color)
export const METHOD_COLORS = {
    GET: "text-emerald-400",
    POST: "text-amber-400",
    PUT: "text-amber-400",
    DELETE: "text-red-400",
    PATCH: "text-amber-400",
    HEAD: "text-emerald-400",
    GRAPHQL: "text-cyan-400",
}

export const METHOD_VARIANTS = {
    GET: "get",
    POST: "post",
    PUT: "put",
    DELETE: "delete",
    PATCH: "patch",
    HEAD: "head",
    GRAPHQL: "graphql",
}
