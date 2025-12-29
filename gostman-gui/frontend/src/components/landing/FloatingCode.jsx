
import React from "react"

export const FloatingCode = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 animate-float opacity-10">
            <pre className="font-mono text-xs text-primary">{`GET /api/users HTTP/1.1
Host: api.example.com`}</pre>
        </div>
        <div className="absolute top-40 right-20 animate-float-delayed opacity-10">
            <pre className="font-mono text-xs text-emerald-400">{`{
  "status": "success",
  "data": []
}`}</pre>
        </div>
        <div className="absolute bottom-40 left-20 animate-float-slow opacity-10">
            <pre className="font-mono text-xs text-cyan-400">{`POST /api/auth
Content-Type: application/json`}</pre>
        </div>
        <div className="absolute bottom-20 right-10 animate-float-delayed opacity-10">
            <pre className="font-mono text-xs text-purple-400">{`X-Rate-Limit: 100
X-Response-Time: 42ms`}</pre>
        </div>
    </div>
)
