import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Radio, Send, MessageSquare, Activity, Wifi, WifiOff } from "lucide-react"

const WS_URL = "wss://api.gostman.io/realtime"

const DEMO_SEQUENCE = [
  { delay: 0, action: "connect" },
  { delay: 800, action: "addMessage", data: { type: "server", text: "Connected to server", event: "open" } },
  { delay: 1200, action: "addMessage", data: { type: "client", text: '{"action":"subscribe","channel":"prices"}', event: "message" } },
  { delay: 1600, action: "addMessage", data: { type: "server", text: '{"channel":"prices","data":{"symbol":"BTC","price":67234.50}}', event: "data" } },
  { delay: 2000, action: "addMessage", data: { type: "server", text: '{"channel":"prices","data":{"symbol":"ETH","price":3456.78}}', event: "data" } },
  { delay: 2400, action: "addMessage", data: { type: "client", text: '{"action":"unsubscribe","channel":"prices"}', event: "message" } },
  { delay: 2800, action: "addMessage", data: { type: "server", text: "Unsubscribed from prices", event: "close" } },
  { delay: 3200, action: "disconnect" },
]

export const WebSocketShowcase = () => {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const scrollRef = useRef(null)
  const timeoutsRef = useRef([])

  useEffect(() => {
    const runSequence = () => {
      // Clear previous timeouts
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []

      // Reset state
      setMessages([])
      setConnected(false)

      // Schedule actions
      DEMO_SEQUENCE.forEach(({ delay, action, data }) => {
        const timeout = setTimeout(() => {
          if (action === "connect") {
            setConnected(true)
          } else if (action === "disconnect") {
            setConnected(false)
          } else if (action === "addMessage") {
            setMessages(prev => [...prev, { ...data, id: Date.now() + Math.random(), timestamp: new Date() }])
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <Radio className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">WebSocket Connection</h3>
          <p className="text-xs text-muted-foreground">Real-time bidirectional messaging</p>
        </div>
        <motion.div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${connected
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : "text-muted-foreground bg-muted/10 border-border/20"
            }`}
          animate={connected ? { opacity: [0.9, 1, 0.9] } : {}}
          transition={{ duration: 2, repeat: connected ? Infinity : 0, ease: "easeInOut" }}
        >
          {connected ? (
            <>
              <motion.span
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              Connected
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Disconnected
            </>
          )}
        </motion.div>
      </div>

      {/* URL Bar */}
      <motion.div
        className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-background/60 border border-border/60 mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Wifi className={`w-4 h-4 ${connected ? "text-emerald-400" : "text-muted-foreground"}`} />
        <code className="flex-1 font-mono text-sm text-muted-foreground truncate">{WS_URL}</code>
        <div
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${connected
              ? "bg-red-500/10 text-red-400"
              : "bg-emerald-500/10 text-emerald-400"
            }`}
        >
          {connected ? "Disconnect" : "Connect"}
        </div>
      </motion.div>

      {/* Messages Panel */}
      <motion.div
        ref={scrollRef}
        className="flex-1 rounded-lg bg-background/40 border border-border/60 overflow-hidden flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Messages List */}
        <div className="flex-1 p-4 space-y-2.5 overflow-auto font-mono text-xs">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`flex ${msg.type === "client" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${msg.type === "client"
                      ? "bg-primary/20 text-foreground border border-primary/20"
                      : msg.event === "open" || msg.event === "close"
                        ? "bg-muted/30 text-muted-foreground border border-border/30"
                        : "bg-emerald-500/10 text-emerald-50 border border-emerald-500/20"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.type === "client" ? (
                      <Send className="w-3 h-3 opacity-60" />
                    ) : (
                      <MessageSquare className="w-3 h-3 text-emerald-400/60" />
                    )}
                    <span className="text-[10px] opacity-60">{formatTime(msg.timestamp)}</span>
                    {msg.event !== "message" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-background/50">
                        {msg.event}
                      </span>
                    )}
                  </div>
                  <div className="break-all leading-relaxed text-[11px]">
                    {msg.text.startsWith("{") ? (
                      <span className="text-emerald-300">{msg.text.slice(0, 60)}{msg.text.length > 60 ? "..." : ""}</span>
                    ) : (
                      <span>{msg.text}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Activity Indicator */}
        <AnimatePresence>
          {connected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="px-4 py-2 border-t border-border/40 bg-muted/10 flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>Listening for messages...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Info Footer */}
      <motion.div
        className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 font-mono">Full-Duplex</span>
        <span>Send and receive messages in real-time</span>
      </motion.div>
    </div>
  )
}
