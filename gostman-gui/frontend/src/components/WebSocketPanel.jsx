import React, { useState, useEffect, useRef } from "react"
import { Plug, Unplug, Send, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Textarea } from "./ui/textarea"
import { Input } from "./ui/input"

/**
 * WebSocket Testing Panel
 * Allows testing WebSocket connections with real-time messaging
 */

const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
}

export function WebSocketPanel({
  url,
  onUrlChange,
  headers
}) {
  const [state, setState] = useState(ConnectionState.DISCONNECTED)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [autoReconnect, setAutoReconnect] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  const connect = () => {
    if (!url || !url.trim()) {
      addMessage('system', 'error', 'Please enter a WebSocket URL')
      return
    }

    // Convert ws:// to wss:// if needed for secure connections
    let wsUrl = url.trim()
    if (wsUrl.startsWith('https://')) {
      wsUrl = wsUrl.replace('https://', 'wss://')
    } else if (wsUrl.startsWith('http://')) {
      wsUrl = wsUrl.replace('http://', 'ws://')
    }

    setState(ConnectionState.CONNECTING)
    addMessage('system', 'info', `Connecting to ${wsUrl}...`)

    try {
      // Parse headers if provided
      let headersObj = {}
      try {
        headersObj = JSON.parse(headers || '{}')
      } catch {}

      // Note: Native WebSocket API doesn't support custom headers in the constructor
      // Headers would need to be negotiated via the URL or subprotocol
      const protocols = []
      if (headersObj['Sec-WebSocket-Protocol']) {
        protocols.push(headersObj['Sec-WebSocket-Protocol'])
      }

      wsRef.current = new WebSocket(wsUrl, protocols.length > 0 ? protocols : undefined)

      wsRef.current.onopen = () => {
        setState(ConnectionState.CONNECTED)
        addMessage('system', 'success', `Connected to ${wsUrl}`)
      }

      wsRef.current.onmessage = (event) => {
        let data = event.data
        let type = 'message'

        // Try to parse as JSON for pretty display
        try {
          const parsed = JSON.parse(data)
          data = JSON.stringify(parsed, null, 2)
          type = 'json'
        } catch {}

        addMessage('received', type, data)
      }

      wsRef.current.onerror = (error) => {
        setState(ConnectionState.ERROR)
        addMessage('system', 'error', 'WebSocket error occurred')
      }

      wsRef.current.onclose = (event) => {
        setState(ConnectionState.DISCONNECTED)
        addMessage('system', 'info', `Connection closed (${event.code}${event.reason ? ': ' + event.reason : ''})`)

        // Auto-reconnect if enabled
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      }
    } catch (error) {
      setState(ConnectionState.ERROR)
      addMessage('system', 'error', `Failed to connect: ${error.message}`)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setState(ConnectionState.DISCONNECTED)
  }

  const send = () => {
    if (!wsRef.current || state !== ConnectionState.CONNECTED) {
      addMessage('system', 'error', 'Not connected')
      return
    }

    if (!message.trim()) return

    try {
      // Send the message
      wsRef.current.send(message)

      // Add to messages as sent
      let displayMessage = message
      let messageType = 'message'

      try {
        const parsed = JSON.parse(message)
        displayMessage = JSON.stringify(parsed, null, 2)
        messageType = 'json'
      } catch {}

      addMessage('sent', messageType, displayMessage)
      setMessage('')
    } catch (error) {
      addMessage('system', 'error', `Failed to send: ${error.message}`)
    }
  }

  const addMessage = (direction, type, content) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      direction,
      type,
      content,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
  }

  const clearMessages = () => {
    setMessages([])
  }

  const getStatusBadge = () => {
    switch (state) {
      case ConnectionState.CONNECTED:
        return (
          <Badge className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        )
      case ConnectionState.CONNECTING:
        return (
          <Badge className="gap-1 bg-blue-500/10 text-blue-400 border-blue-500/20">
            <Clock className="h-3 w-3 animate-pulse" />
            Connecting...
          </Badge>
        )
      case ConnectionState.ERROR:
        return (
          <Badge className="gap-1 bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        )
      default:
        return (
          <Badge className="gap-1 bg-muted text-muted-foreground">
            <Unplug className="h-3 w-3" />
            Disconnected
          </Badge>
        )
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-3">
          <Plug className="h-4 w-4 text-cyan-500" />
          <span className="text-sm font-medium">WebSocket</span>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={autoReconnect}
              onChange={(e) => setAutoReconnect(e.target.checked)}
              className="rounded"
            />
            Auto-reconnect
          </label>
        </div>
      </div>

      {/* URL Input */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Input
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="wss://echo.websocket.org"
            className="flex-1 font-mono text-sm"
            disabled={state === ConnectionState.CONNECTED || state === ConnectionState.CONNECTING}
          />
          {state === ConnectionState.CONNECTED || state === ConnectionState.CONNECTING ? (
            <Button
              size="sm"
              variant="destructive"
              onClick={disconnect}
              className="gap-2"
            >
              <Unplug className="h-4 w-4" />
              Disconnect
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={connect}
              className="gap-2"
            >
              <Plug className="h-4 w-4" />
              Connect
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-background">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <div className="text-center">
              <Plug className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-xs mt-1">Connect to a WebSocket server to begin</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`
                  flex gap-2 p-3 rounded-lg text-sm
                  ${msg.direction === 'sent' ? 'bg-primary/10 ml-8' : ''}
                  ${msg.direction === 'received' ? 'bg-muted/50 mr-8' : ''}
                  ${msg.direction === 'system' ? 'bg-muted/30 border border-border/50' : ''}
                `}
              >
                <div className="shrink-0 pt-0.5">
                  {msg.direction === 'sent' && <Send className="h-3.5 w-3.5 text-primary" />}
                  {msg.direction === 'received' && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                  {msg.direction === 'system' && (
                    msg.type === 'error' ? <XCircle className="h-3.5 w-3.5 text-destructive" /> :
                    msg.type === 'success' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> :
                    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`
                      text-xs font-medium uppercase
                      ${msg.direction === 'sent' ? 'text-primary' : ''}
                      ${msg.direction === 'received' ? 'text-emerald-500' : ''}
                      ${msg.direction === 'system' ? 'text-muted-foreground' : ''}
                    `}>
                      {msg.direction === 'sent' ? 'SENT' : msg.direction === 'received' ? 'RECEIVED' : 'SYSTEM'}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTime(msg.timestamp)}</span>
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words overflow-x-auto">
                    {msg.content}
                  </pre>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-border/50 p-4 bg-muted/20">
        <div className="flex gap-2 mb-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='{{"action": "ping"}'
            className="flex-1 h-20 font-mono text-sm resize-none"
            disabled={state !== ConnectionState.CONNECTED}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                send()
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Press Ctrl+Enter to send
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={clearMessages}
              disabled={messages.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={send}
              disabled={state !== ConnectionState.CONNECTED || !message.trim()}
              className="gap-2"
            >
              <Send className="h-3 w-3" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Detects if a URL is a WebSocket URL
 */
export function isWebSocketURL(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim().toLowerCase()
  return trimmed.startsWith('ws://') || trimmed.startsWith('wss://')
}
