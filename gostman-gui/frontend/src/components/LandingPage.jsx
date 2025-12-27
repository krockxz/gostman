import React, { useState, useEffect } from "react"
import { Button, buttonVariants } from "./ui/button"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { cn } from "../lib/utils"
import {
  Terminal,
  Zap,
  Download,
  Globe,
  Keyboard,
  Code,
  Package,
  Shield,
  Github,
  ArrowRight,
  Check,
  Apple,
  Monitor,
  Server,
  Command,
  Braces,
  Hash,
  Heading1,
  FolderOpen,
  Sparkles,
  Cpu,
  Gauge,
  ChevronDown,
} from "lucide-react"

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
    description: "Beautifully formatted responses with color-coded syntax",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    icon: FolderOpen,
    title: "Collections",
    description: "Organize your requests into collections for easy access",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    icon: Keyboard,
    title: "Keyboard Shortcuts",
    description: "Power user shortcuts for rapid API testing workflows",
    gradient: "from-green-400 to-emerald-500",
  },
  {
    icon: Code,
    title: "Environment Variables",
    description: "Manage multiple environments with dynamic variable support",
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
    icon: Apple,
    href: "https://github.com/krockxz/gostman/releases/latest/download/Gostman-darwin-universal.dmg",
    iconColor: "text-foreground/90"
  },
  {
    os: "Windows",
    desc: "64-bit Installer",
    icon: Monitor,
    href: "https://github.com/krockxz/gostman/releases/latest/download/Gostman-windows-amd64.exe",
    iconColor: "text-blue-400"
  },
  {
    os: "Linux",
    desc: "AppImage (Universal)",
    icon: Server,
    href: "https://github.com/krockxz/gostman/releases/latest/download/Gostman-linux-amd64.AppImage",
    iconColor: "text-amber-400"
  }
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
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground font-bold shadow-lg shadow-primary/25">
                <span className="text-lg">G</span>
              </div>
              <span className="font-semibold text-base">Gostman</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/krockxz/gostman"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-sm")}
              >
                <Github className="h-4 w-4" />
                GitHub
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
              <span className="block">Test APIs</span>
              <span className="block mt-2">
                <span className="bg-gradient-to-r from-primary via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Without the Bloat
                </span>
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              <TypingAnimation text="A lightweight, fast, and beautiful HTTP client for developers who value simplicity." delay={50} />
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
                <div className="flex-1 text-center">
                  <span className="text-xs font-mono text-muted-foreground">Gostman HTTP Client</span>
                </div>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-muted/20 to-muted/5 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground font-bold shadow-2xl shadow-primary/30 mx-auto">
                    <Terminal className="h-10 w-10" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">
                    Your API testing workspace
                  </p>
                  <Button onClick={onGetStarted} className="gap-2">
                    Launch Gostman
                    <ArrowRight className="h-4 w-4" />
                  </Button>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground font-bold">
                <span className="text-sm">G</span>
              </div>
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
