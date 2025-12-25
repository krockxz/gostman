import React, { useState, useEffect } from "react"
import { Button } from "./ui/button"
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
            <a
              href="https://github.com/krockxz/gostman/releases/latest/download/Gostman-darwin-universal.dmg"
              className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors border-b border-border/30"
              onClick={() => setIsOpen(false)}
            >
              <Apple className="h-5 w-5 text-foreground/90" />
              <div className="flex-1">
                <div className="font-semibold">macOS</div>
                <div className="text-xs text-muted-foreground">Universal Binary (Intel + Apple Silicon)</div>
              </div>
              <Download className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="https://github.com/krockxz/gostman/releases/latest/download/Gostman-windows-amd64.exe"
              className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors border-b border-border/30"
              onClick={() => setIsOpen(false)}
            >
              <Monitor className="h-5 w-5 text-blue-400" />
              <div className="flex-1">
                <div className="font-semibold">Windows</div>
                <div className="text-xs text-muted-foreground">64-bit Installer</div>
              </div>
              <Download className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="https://github.com/krockxz/gostman/releases/latest/download/Gostman-linux-amd64.AppImage"
              className="flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Server className="h-5 w-5 text-amber-400" />
              <div className="flex-1">
                <div className="font-semibold">Linux</div>
                <div className="text-xs text-muted-foreground">AppImage (Universal)</div>
              </div>
              <Download className="h-4 w-4 text-muted-foreground" />
            </a>
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

  const features = [
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

  const comparisons = [
    { feature: "Built with Go", gostman: "✓", others: "✗" },
    { feature: "Offline First", gostman: "✓", others: "✗" },
    { feature: "No Account Required", gostman: "✓", others: "✗" },
    { feature: "Open Source", gostman: "✓", others: "✓" },
    { feature: "Lightweight (<50MB)", gostman: "✓", others: "✗" },
    { feature: "Local Data Only", gostman: "✓", others: "✗" },
  ]

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
              <Button variant="ghost" size="sm" className="gap-2 text-sm" asChild>
                <a href="https://github.com/krockxz/gostman" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
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
            {features.map((feature, index) => (
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
                {comparisons.map((item, index) => (
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

      {/* CTA Section */}
      <section className="relative py-20 px-6 bg-muted/10" data-animate="cta">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-cyan-500/20 to-emerald-500/20 blur-3xl" />
            <Card className="relative border-primary/20 bg-gradient-to-br from-background to-muted/20">
              <CardContent className="p-12 space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold">
                  Ready to Streamline Your
                  <span className="block mt-2 bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                    API Testing?
                  </span>
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Join thousands of developers who've switched to a lighter, faster HTTP client.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <DownloadDropdown />
                  <Button size="lg" variant="outline" className="gap-3 text-lg px-8 py-6 border-primary/30" asChild>
                    <a href="https://github.com/krockxz/gostman" target="_blank" rel="noopener noreferrer">
                      <Github className="h-5 w-5" />
                      Star on GitHub
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-500 text-primary-foreground font-bold">
                  <span className="text-sm">G</span>
                </div>
                <span className="font-semibold">Gostman</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A lightweight HTTP client for developers who value simplicity and speed.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Download</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Roadmap</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Tutorials</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Report Issue</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Gostman. Open source, always free.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">License</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes pulse-slow-delayed {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-pulse-slow-delayed {
          animation: pulse-slow-delayed 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
