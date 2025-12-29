import React, { useState, useEffect } from "react"
import { Button, buttonVariants } from "./ui/button"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { cn } from "../lib/utils"
import {
  Zap,
  Download,
  Globe,
  Code,
  Github,
  ArrowRight,
  Check,
  FolderOpen,
  Command,
  Star,
  ChevronDown,
} from "lucide-react"

const AppleIcon = ({ className }) => (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
)

const WindowsIcon = ({ className }) => (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M0 3.449L9.75 2.1v9.451H0v-8.102zm10.949-1.655L24 0v11.4H10.949V1.794zM0 13.083h9.75v8.102L0 19.689v-6.606zm10.949 0H24v9.64L10.949 20.45v-7.367z" />
  </svg>
)
import logo from "../assets/logo.jpg"

const FEATURES = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built with Go for instant startup and blazing-fast response times",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    icon: Braces,
    title: "JSON Syntax Highlighting",
    description: "Beautifully formatted responses. No more squinting at raw text.",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    icon: FolderOpen,
    title: "Collections",
    description: "Organize your requests into collections for easy access",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    icon: Command,
    title: "Keyboard Shortcuts",
    description: "Cmd + Enter to Send. Designed for speed enthusiasts.",
    gradient: "from-green-400 to-emerald-500",
  },
  {
    icon: Code,
    title: "Environment Variables",
    description: "Use {{base_url}} in your requests. Switch configs instantly.",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    icon: Shield,
    title: "Local & Private",
    description: "All data stays on your machine. No cloud, no tracking",
    gradient: "from-red-400 to-rose-500",
  },
]

const COMPARISONS = [
  { feature: "Built with Go", gostman: "✓", others: "✗" },
  { feature: "Offline First", gostman: "✓", others: "✗" },
  { feature: "No Account Required", gostman: "✓", others: "✗" },
  { feature: "Open Source", gostman: "✓", others: "✓" },
  { feature: "Lightweight (<50MB)", gostman: "✓", others: "✗" },
  { feature: "Local Data Only", gostman: "✓", others: "✗" },
]

const DOWNLOAD_OPTIONS = [
  {
    os: "macOS",
    desc: "Universal Binary (Intel + Apple Silicon)",
    icon: AppleIcon,
    href: "https://github.com/krockxz/gostman/releases/latest/download/Gostman-darwin-universal.zip",
    iconColor: "text-foreground/90"
  },
  {
    os: "Windows",
    desc: "64-bit Installer",
    icon: WindowsIcon,
    href: "https://github.com/krockxz/gostman/releases/latest/download/Gostman-windows-amd64.exe",
    iconColor: "text-blue-400"
  },
]

const TypingAnimation = ({ text, delay = 100 }) => {
  const [displayText, setDisplayText] = useState("")
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev + text[index])
        setIndex((prev) => prev + 1)
      }, delay)
      return () => clearTimeout(timeout)
    }
  }, [index, text, delay])

  return (
    <span className="font-mono text-primary">
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

const FloatingCode = () => (
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

const DownloadDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        size="lg"
        className="gap-3 text-lg px-8 py-6 glow shadow-xl shadow-primary/20"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Download className="h-5 w-5" />
        Download for Desktop
        <ChevronDown className="h-5 w-5" />
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-20 min-w-[280px] rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/20 overflow-hidden">
            {DOWNLOAD_OPTIONS.map((option) => (
              <a
                key={option.os}
                href={option.href}
                className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors border-b border-border/30 last:border-0"
                onClick={() => setIsOpen(false)}
              >
                <option.icon className={`h-5 w-5 ${option.iconColor}`} />
                <div className="flex-1">
                  <div className="font-semibold">{option.os}</div>
                  <div className="text-xs text-muted-foreground">{option.desc}</div>
                </div>
                <Download className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function LandingPage({ onGetStarted }) {
  const [scrollY, setScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState({})
  const [stars, setStars] = useState(null)

  useEffect(() => {
    fetch("/api/stars")
      .then((res) => {
        if (!res.ok) throw new Error("API response not ok")
        return res.json()
      })
      .then((data) => setStars(data.stars))
      .catch((err) => {
        console.error("Failed to fetch stars from API:", err)
      })
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }))
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Gradient orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-slow-delayed" />

      <FloatingCode />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-6">
        <div className="max-w-4xl w-full backdrop-blur-xl bg-background/60 border border-border/40 rounded-2xl shadow-2xl shadow-primary/5">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Gostman Logo" className="h-10 w-10 rounded-lg shadow-lg shadow-primary/25" />
              <span className="font-semibold text-base">Gostman</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/krockxz/gostman"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-sm")}
              >
                {stars !== null ? (
                  <>
                    <div className="flex items-center gap-1.5 border-r border-border/50 pr-2 mr-2">
                      <Github className="h-4 w-4" />
                      <span className="font-semibold">Star</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-mono text-xs">{stars.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 border-r border-border/50 pr-2 mr-2">
                      <Github className="h-4 w-4" />
                      <span className="font-semibold">Star</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-mono text-xs">--</span>
                    </div>
                  </>
                )}
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <Badge className="mb-4 px-4 py-1.5 text-xs font-mono border-primary/20 bg-primary/10 text-primary glow-subtle">
              <Sparkles className="h-3 w-3 mr-1.5" />
              Open Source HTTP Client
            </Badge>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="block">The HTTP Client</span>
              <span className="block mt-2">
                <span className="bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  For the Go Era
                </span>
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              <TypingAnimation text="The Native HTTP Client. 10x lighter than Postman." delay={50} />
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <DownloadDropdown />
              <Button size="lg" variant="outline" className="gap-3 text-lg px-8 py-6 border-primary/30 hover:bg-primary/10" onClick={onGetStarted}>
                <Globe className="h-5 w-5" />
                Try Web Version
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>No account needed</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Open source</span>
              </div>
            </div>

            <div className="pt-8 flex justify-center">
              <Badge variant="outline" className="gap-2 py-1.5 px-4 bg-background/50 backdrop-blur border-primary/20">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
                Powered by Wails (Go + React)
              </Badge>
            </div>
          </div>

          {/* App Preview */}
          <div className="mt-20 relative" data-animate="hero-preview">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <Card className="border-border/50 bg-background/50 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/20">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 text-center flex items-center justify-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">GET https://api.gostman.io/v1/users</span>
                </div>
              </div>
              <div className="aspect-[16/9] bg-background relative overflow-hidden group">
                {/* Mock Interface using HTML/CSS since Image Generation Failed */}
                <div className="absolute inset-0 flex">
                  <div className="w-64 border-r border-border/40 hidden md:block bg-muted/5 p-4 space-y-3">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Collections</div>
                    <div className="p-2 rounded bg-primary/10 text-primary text-sm font-medium">User API</div>
                    <div className="p-2 rounded hover:bg-muted/10 text-muted-foreground text-sm">Auth Flow</div>
                    <div className="p-2 rounded hover:bg-muted/10 text-muted-foreground text-sm">Payments</div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="h-12 border-b border-border/40 flex items-center px-4 gap-4">
                      <span className="text-blue-400 font-bold text-sm">GET</span>
                      <div className="flex-1 bg-muted/10 h-8 rounded text-sm flex items-center px-3 text-muted-foreground font-mono">https://api.gostman.io/v1/users</div>
                      <Button size="sm" className="h-8">Send</Button>
                    </div>
                    <div className="flex-1 p-4 font-mono text-sm overflow-hidden relative">
                      <div className="flex justify-between items-center mb-4 text-xs text-muted-foreground border-b border-border/40 pb-2">
                        <span className="text-green-400 font-bold">200 OK</span>
                        <span>45ms</span>
                        <span>1.2KB</span>
                      </div>
                      <div className="space-y-1 text-muted-foreground">
                        <div><span className="text-yellow-400">{"{"}</span></div>
                        <div className="pl-4"><span className="text-blue-400">"status"</span>: <span className="text-green-400">"success"</span>,</div>
                        <div className="pl-4"><span className="text-blue-400">"data"</span>: <span className="text-yellow-400">{"["}</span></div>
                        <div className="pl-8"><span className="text-blue-400">{"{"}</span></div>
                        <div className="pl-12"><span className="text-blue-400">"id"</span>: <span className="text-purple-400">101</span>,</div>
                        <div className="pl-12"><span className="text-blue-400">"username"</span>: <span className="text-green-400">"gopher_fan"</span>,</div>
                        <div className="pl-12"><span className="text-blue-400">"role"</span>: <span className="text-green-400">"admin"</span></div>
                        <div className="pl-8"><span className="text-blue-400">{"},"}</span></div>
                        <div className="pl-8"><span className="text-blue-400">{"{"}</span></div>
                        <div className="pl-12"><span className="text-blue-400">"id"</span>: <span className="text-purple-400">102</span>,</div>
                        <div className="pl-12"><span className="text-blue-400">"username"</span>: <span className="text-green-400">"rust_enjoyer"</span>,</div>
                        <div className="pl-12"><span className="text-blue-400">"role"</span>: <span className="text-green-400">"user"</span></div>
                        <div className="pl-8"><span className="text-blue-400">{"}"}</span></div>
                        <div className="pl-4"><span className="text-yellow-400">{"]"}</span></div>
                        <div><span className="text-yellow-400">{"}"}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-6" data-animate="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1.5 text-xs font-mono border-primary/20 bg-primary/10 text-primary">
              <Cpu className="h-3 w-3 mr-1.5" />
              Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need,
              <span className="block mt-2 text-primary">Nothing You Don't</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built by developers, for developers. Every feature crafted with care.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <Card
                key={feature.title}
                className={cn(
                  "group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/10 transition-all duration-300",
                  "hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30 hover:-translate-y-1"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br mb-4",
                    feature.gradient,
                    "shadow-lg"
                  )}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative py-20 px-6" data-animate="comparison">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1.5 text-xs font-mono border-primary/20 bg-primary/10 text-primary">
              <Gauge className="h-3 w-3 mr-1.5" />
              Comparison
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose Gostman?
            </h2>
            <p className="text-xl text-muted-foreground">
              Lightweight, fast, and respects your privacy
            </p>
          </div>

          <Card className="border-border/50 bg-background/50 backdrop-blur">
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 pb-4 border-b">
                  <div className="font-semibold">Feature</div>
                  <div className="text-center font-semibold text-primary">Gostman</div>
                  <div className="text-center font-semibold text-muted-foreground">Others</div>
                </div>
                {COMPARISONS.map((item, index) => (
                  <div
                    key={item.feature}
                    className="grid grid-cols-3 gap-4 py-3 items-center hover:bg-muted/30 rounded-lg px-3 transition-colors"
                  >
                    <div className="text-sm">{item.feature}</div>
                    <div className="text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-full",
                        item.gostman === "✓" ? "bg-emerald-500/20 text-emerald-400" : ""
                      )}>
                        {item.gostman}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-full",
                        item.others === "✓" ? "bg-emerald-500/20 text-emerald-400" : "bg-muted/20 text-muted-foreground"
                      )}>
                        {item.others}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Gostman Logo" className="h-8 w-8 rounded-lg" />
              <div>
                <span className="font-semibold">Gostman</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A lightweight HTTP client for developers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="https://github.com/krockxz/gostman"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a
                href="https://github.com/krockxz/gostman/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Report Issue
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Gostman. Open source, always free.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
