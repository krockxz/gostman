import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Braces, Play } from "lucide-react"

const GRAPHQL_RESPONSE = {
  data: {
    user: {
      id: "101",
      username: "gopher_fan",
      email: "gopher@example.com",
      profile: {
        avatar: "https://avatar.example.com/gopher.jpg",
        bio: "Go enthusiast | API builder",
        location: "San Francisco, CA",
      },
      repositories: {
        edges: [
          {
            node: { name: "gostman", description: "Lightweight HTTP client", stars: 1234 },
          },
          {
            node: { name: "go-api-tools", description: "API development toolkit", stars: 567 },
          },
        ],
      },
    },
  },
}

const DEMO_SEQUENCE = [
  { delay: 0, action: "reset" },
  { delay: 1500, action: "execute" },
  { delay: 2500, action: "showResponse" },
]

export const GraphQLShowcase = () => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [showResponse, setShowResponse] = useState(false)
  const timeoutsRef = useRef([])

  useEffect(() => {
    const runSequence = () => {
      // Clear previous timeouts
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []

      // Reset state
      setIsExecuting(false)
      setShowResponse(false)

      // Schedule actions
      DEMO_SEQUENCE.forEach(({ delay, action }) => {
        const timeout = setTimeout(() => {
          if (action === "reset") {
            setIsExecuting(false)
            setShowResponse(false)
          } else if (action === "execute") {
            setIsExecuting(true)
          } else if (action === "showResponse") {
            setIsExecuting(false)
            setShowResponse(true)
          }
        }, delay)
        timeoutsRef.current.push(timeout)
      })

      // Loop the sequence
      const loopTimeout = setTimeout(runSequence, 5000)
      timeoutsRef.current.push(loopTimeout)
    }

    runSequence()

    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  const renderJSON = (obj, depth = 0) => {
    if (typeof obj !== "object" || obj === null) {
      return <span className="text-emerald-300">"{obj}"</span>
    }

    return (
      <div className="space-y-0.5">
        <span className="text-amber-300">{"{"}</span>
        {Object.entries(obj).slice(0, depth === 0 ? 3 : 2).map(([key, value], i, arr) => (
          <div key={key} className="pl-4">
            <span className="text-blue-300">"{key}"</span>:{" "}
            {typeof value === "string" ? (
              <span className="text-emerald-300">"{value.slice(0, 40)}{value.length > 40 ? "..." : ""}"</span>
            ) : Array.isArray(value) ? (
              <>
                <span className="text-amber-300">[</span>
                <span className="text-muted-foreground/50">...{value.length} items</span>
                <span className="text-amber-300">]</span>
              </>
            ) : typeof value === "object" ? (
              <span className="text-amber-300">{"{...}"}</span>
            ) : (
              <span className="text-purple-300">{value}</span>
            )}
            {i < arr.length - 1 && ","}
          </div>
        ))}
        <span className="text-amber-300">{"}"}</span>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-pink-500/10">
          <Braces className="w-5 h-5 text-pink-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">GraphQL Request</h3>
          <p className="text-xs text-muted-foreground">
            {!showResponse && !isExecuting && "Write your query"}
            {isExecuting && "Executing..."}
            {showResponse && !isExecuting && "View structured response"}
          </p>
        </div>
        <motion.button
          className={`px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2 ${isExecuting
              ? "bg-muted text-muted-foreground"
              : "bg-pink-500/10 text-pink-400"
            }`}
          animate={isExecuting ? { scale: [1, 0.98, 1] } : {}}
          transition={{ duration: 1, repeat: isExecuting ? Infinity : 0 }}
        >
          {isExecuting ? (
            <>
              <motion.span
                className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Running
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Query
            </>
          )}
        </motion.button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Query Panel */}
        <motion.div
          className="bg-background/60 backdrop-blur-sm rounded-lg border border-border/60 overflow-hidden flex flex-col"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="px-4 py-2 border-b border-border/40 bg-muted/20">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Query
            </span>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
            <div className="space-y-1 text-muted-foreground">
              <div>
                <span className="text-purple-400">query</span>{" "}
                <span className="text-blue-400">GetUserProfile</span>(
                <span className="text-amber-400">$username</span>:{" "}
                <span className="text-cyan-400">String!</span>) {"{"}
              </div>
              <div className="pl-4">
                <span className="text-blue-400">user</span>(username: <span className="text-amber-400">$username</span>) {"{"}
              </div>
              <div className="pl-8 space-y-0.5">
                {["id", "username", "email"].map((field) => (
                  <div key={field} className="text-blue-300">{field}</div>
                ))}
                <div className="text-blue-300 space-y-0.5">
                  <div>profile {"{"}</div>
                  <div className="pl-4 space-y-0.5">
                    {["avatar", "bio", "location"].map((field) => (
                      <div key={field} className="text-blue-300">{field}</div>
                    ))}
                  </div>
                  <div>{"}"}</div>
                </div>
              </div>
              <div className="pl-4">{"}"}</div>
              <div>{"}"}</div>
            </div>
          </div>
        </motion.div>

        {/* Response Panel */}
        <motion.div
          className="bg-background/60 backdrop-blur-sm rounded-lg border border-border/60 overflow-hidden flex flex-col"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Response
            </span>
            <AnimatePresence>
              {showResponse && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400"
                >
                  200 OK
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs">
            <AnimatePresence mode="wait">
              {!showResponse ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center text-muted-foreground/50"
                >
                  <div className="text-center space-y-2">
                    <Braces className="w-10 h-10 mx-auto opacity-30" />
                    <p className="text-xs">Run a query to see the response</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="response"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderJSON(GRAPHQL_RESPONSE)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Feature highlight */}
      <motion.div
        className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-mono">
          No over-fetching
        </span>
        <span>Get exactly the data you need, nothing more.</span>
      </motion.div>
    </div>
  )
}
