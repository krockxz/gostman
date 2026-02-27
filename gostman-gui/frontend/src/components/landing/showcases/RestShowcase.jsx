import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Copy, Check } from "lucide-react"

const METHODS = {
  GET: { color: "text-blue-400", bg: "bg-blue-400/10" },
  POST: { color: "text-emerald-400", bg: "bg-emerald-400/10" },
  PUT: { color: "text-amber-400", bg: "bg-amber-400/10" },
  DELETE: { color: "text-red-400", bg: "bg-red-400/10" },
}

const INITIAL_REQUEST = {
  method: "GET",
  url: "https://api.gostman.io/v1/users",
  headers: { "Content-Type": "application/json" },
  body: null,
}

const RESPONSE_DATA = {
  status: 200,
  statusText: "OK",
  time: "45ms",
  size: "1.2KB",
  headers: {
    "content-type": "application/json",
    "x-ratelimit-remaining": "97",
    "x-response-time": "45ms",
  },
  body: {
    status: "success",
    data: [
      { id: 101, username: "gopher_fan", role: "admin", email: "gopher@example.com" },
      { id: 102, username: "rust_enjoyer", role: "user", email: "rust@example.com" },
      { id: 103, username: "websocket_dev", role: "user", email: "ws@example.com" },
    ],
  },
}

export const RestShowcase = () => {
  const [step, setStep] = useState(0)
  const [request, setRequest] = useState(INITIAL_REQUEST)
  const [response, setResponse] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)


  useEffect(() => {
    let mounted = true
    let timeoutId = null

    const interval = setInterval(() => {
      setStep((prev) => {
        const next = (prev + 1) % 5
        if (next === 1 && mounted) {
          setIsSending(true)
          timeoutId = setTimeout(() => {
            if (mounted) {
              setResponse(RESPONSE_DATA)
              setIsSending(false)
            }
          }, 800)
        }
        if (next === 0 && mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          setResponse(null)
          setIsSending(false)
        }
        return next
      })
    }, 2500)

    return () => {
      mounted = false
      clearInterval(interval)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  const copyCode = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const methodStyle = METHODS[request.method]

  return (
    <div className="w-full h-full flex flex-col">
      {/* Step indicator */}


      {/* Request Section */}
      <motion.div
        className="flex-1 bg-background/60 backdrop-blur-sm rounded-lg border border-border/60 overflow-hidden flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Request Bar */}
        <div className="flex items-center gap-3 p-4 border-b border-border/40 bg-muted/20">
          <motion.div
            className={`px-3 py-1.5 rounded-md font-bold text-sm ${methodStyle.color} ${methodStyle.bg}`}
            key={request.method}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {request.method}
          </motion.div>
          <motion.div
            className="flex-1 bg-background rounded-md px-4 py-2 font-mono text-sm text-muted-foreground flex items-center"
            initial={{ width: 0 }}
            animate={{ width: "auto" }}
            transition={{ delay: 0.5 }}
          >
            <span className="truncate">{request.url}</span>
          </motion.div>
          <motion.button
            className={`px-6 py-2 rounded-md font-semibold text-sm flex items-center gap-2 ${isSending
              ? "bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              }`}
            animate={isSending ? { scale: [1, 0.95, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isSending ? (
              <>
                <motion.span
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </motion.button>
        </div>

        {/* Response Section */}
        <AnimatePresence mode="wait">
          {response ? (
            <motion.div
              key="response"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Response Headers */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-emerald-500/5">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-emerald-400 font-bold">{response.status}</span>
                  <span className="text-muted-foreground">{response.statusText}</span>
                  <div className="h-4 w-px bg-border/40" />
                  <span className="text-muted-foreground/70">{response.time}</span>
                  <span className="text-muted-foreground/70">{response.size}</span>
                </div>
                <motion.button
                  className="p-2 hover:bg-muted/30 rounded-md transition-colors"
                  onClick={copyCode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </motion.button>
              </div>

              {/* Response Body */}
              <div className="flex-1 p-4 font-mono text-sm overflow-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-1"
                >
                  <div>
                    <span className="text-amber-300">{"{"}</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-blue-300">"status"</span>:
                    <span className="text-emerald-300"> "success"</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-blue-300">"data"</span>:
                    <span className="text-amber-300"> ["</span>
                  </div>
                  {response.body.data.map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.15 }}
                      className="pl-8"
                    >
                      <span className="text-amber-300">{"{"}</span>
                      <div className="pl-4">
                        <span className="text-blue-300">"id"</span>:{" "}
                        <span className="text-purple-300">{user.id}</span>,
                      </div>
                      <div className="pl-4">
                        <span className="text-blue-300">"username"</span>:{" "}
                        <span className="text-emerald-300">"{user.username}"</span>,
                      </div>
                      <div className="pl-4">
                        <span className="text-blue-300">"role"</span>:{" "}
                        <span className="text-emerald-300">"{user.role}"</span>
                      </div>
                      <span className="text-amber-300">{"},"}</span>
                    </motion.div>
                  ))}
                  <div className="pl-4">
                    <span className="text-amber-300">{"]"}</span>
                  </div>
                  <div>
                    <span className="text-amber-300">{"}"}</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center text-muted-foreground/50"
            >
              <div className="text-center space-y-2">
                <Send className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-sm">Send a request to see the response</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
