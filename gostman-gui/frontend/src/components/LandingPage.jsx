import React, { useState, useEffect } from "react"
import { Button, buttonVariants } from "./ui/button"
import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { cn } from "../lib/utils"
import {
  Zap,
  Globe,
  Code,
  Github,
  ArrowRight,
  Check,
  X,
  FolderOpen,
  Command,
  Star,
  Braces,
  Shield,
} from "lucide-react"

import logo from "../assets/logo.jpg"

const FEATURES = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built with Go for instant startup and blazing-fast response times",
  },
  {
    icon: Braces,
    title: "JSON Syntax Highlighting",
    description: "Beautifully formatted responses. No more squinting at raw text.",
  },
  {
    icon: FolderOpen,
    title: "Collections",
    description: "Organize your requests into collections for easy access",
  },
  {
    icon: Command,
    title: "Keyboard Shortcuts",
    description: "Cmd + Enter to Send. Designed for speed enthusiasts.",
  },
  {
    icon: Code,
    title: "Environment Variables",
    description: "Use {{base_url}} in your requests. Switch configs instantly.",
  },
  {
    icon: Shield,
    title: "Local & Private",
    description: "All data stays on your machine. No cloud, no tracking",
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

import { TypingAnimation } from "./landing/TypingAnimation"
import { FloatingCode } from "./landing/FloatingCode"
import { DownloadDropdown } from "./landing/DownloadDropdown"

const useGitHubStars = () => {
  const [stars, setStars] = useState(null)

  useEffect(() => {
    const controller = new AbortController();

    const fetchStars = async () => {
      try {
        // Try our own secure API first (for Vercel/Prod)
        const response = await fetch("/api/stars", { signal: controller.signal });

        // If response is HTML (404/500 from Vite) or not ok, throw to trigger fallback
        const contentType = response.headers.get("content-type");
        if (!response.ok || (contentType && contentType.includes("text/html"))) {
          throw new Error("Local/API endpoint unavailable");
        }

        const data = await response.json();
        setStars(data.stars);
      } catch (err) {
        if (err.name === 'AbortError') return;

        // Fallback to direct GitHub API
        try {
          const ghResponse = await fetch("https://api.github.com/repos/krockxz/gostman", {
            signal: controller.signal
          });
          if (!ghResponse.ok) throw new Error("GitHub API failed");
          const ghData = await ghResponse.json();
          setStars(ghData.stargazers_count);
        } catch (ghErr) {
          if (ghErr.name !== 'AbortError') {
            console.error("Failed to fetch stars:", ghErr);
          }
        }
      }
    };

    fetchStars();

    return () => controller.abort()
  }, [])

  return stars
}

export function LandingPage({ onGetStarted }) {
  const [isVisible, setIsVisible] = useState({})
  const stars = useGitHubStars()

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
      {/* Subtle background mesh gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_50%,rgba(16,185,129,0.05),rgba(255,255,255,0))]" />
      </div>

      <FloatingCode />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-6">
        <div className="max-w-5xl w-full backdrop-blur-md bg-background/70 border border-border/50 rounded-xl shadow-sm">
          <div className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Gostman Logo" className="h-8 w-8 rounded-md" />
              <span className="font-medium text-sm">Gostman</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/krockxz/gostman"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 text-sm hover:bg-muted/50")}
              >
                <Github className="h-4 w-4" />
                <span className="font-medium">Star</span>
                {stars !== null && (
                  <span className="font-mono text-xs text-muted-foreground">{stars.toLocaleString()}</span>
                )}
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium border-border/60 bg-muted/30">
              Open Source HTTP Client
            </Badge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1]">
              <span className="block">The HTTP Client</span>
              <span className="block mt-2 text-muted-foreground">
                For the Go Era
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              <TypingAnimation text="The Native HTTP Client. 10x lighter than Postman." delay={50} />
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
              <DownloadDropdown />
              <Button size="lg" variant="outline" className="gap-2 text-base px-6 py-5.5 border-border/60 hover:bg-muted/50" onClick={onGetStarted}>
                <Globe className="h-4 w-4" />
                Try Web Version
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 pt-6 text-sm text-muted-foreground/80">
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5" />
                <span>No account needed</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5" />
                <span>Open source</span>
              </div>
            </div>

            <div className="pt-6 flex justify-center">
              <Badge variant="outline" className="gap-2 px-3 py-1 text-xs bg-muted/20 border-border/40">
                Powered by Wails (Go + React)
              </Badge>
            </div>
          </div>

          {/* App Preview */}
          <div className="mt-16 relative" data-animate="hero-preview">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <Card className="border-border/60 bg-background/80 backdrop-blur-sm shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                  <div className="w-3 h-3 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 text-center flex items-center justify-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground/70">GET https://api.gostman.io/v1/users</span>
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
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="h-12 border-b border-border/40 flex items-center px-4 gap-2 md:gap-4">
                      <span className="text-blue-400 font-bold text-sm shrink-0">GET</span>
                      <div className="flex-1 bg-muted/10 h-8 rounded text-sm flex items-center px-3 text-muted-foreground font-mono truncate min-w-0">
                        <span className="truncate">https://api.gostman.io/v1/users</span>
                      </div>
                      <Button size="sm" className="h-8 shrink-0">Send</Button>
                    </div>
                    <div className="flex-1 p-4 font-mono text-sm overflow-hidden relative">
                      <div className="flex justify-between items-center mb-4 text-xs text-muted-foreground border-b border-border/40 pb-2 gap-2">
                        <span className="text-green-400 font-bold shrink-0">200 OK</span>
                        <span className="shrink-0">45ms</span>
                        <span className="shrink-0">1.2KB</span>
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
      <section className="relative py-24 px-6" data-animate="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-3">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built by developers, for developers. Every feature crafted with care.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, index) => (
              <Card
                key={feature.title}
                className={cn(
                  "group border border-border/60 bg-background/40 backdrop-blur-sm transition-all duration-200",
                  "hover:border-border hover:bg-background/60 hover:shadow-md"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-5">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-md mb-4",
                    "bg-muted/20",
                    "group-hover:bg-muted/30 transition-colors duration-200"
                  )}>
                    <feature.icon className="h-5 w-5 text-muted-foreground/60" />
                  </div>
                  <h3 className="text-base font-semibold mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="relative py-24 px-6" data-animate="comparison">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-3">
              Why Choose Gostman?
            </h2>
            <p className="text-muted-foreground">
              Lightweight, fast, and respects your privacy
            </p>
          </div>

          <Card className="border border-border/60 bg-background/40 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="space-y-1">
                <div className="grid grid-cols-3 gap-4 pb-3 border-b border-border/40">
                  <div className="font-medium text-sm">Feature</div>
                  <div className="text-center font-medium text-sm">Gostman</div>
                  <div className="text-center font-medium text-sm text-muted-foreground">Others</div>
                </div>
                {COMPARISONS.map((item, index) => (
                  <div
                    key={item.feature}
                    className="grid grid-cols-3 gap-4 py-3 items-center hover:bg-muted/30 rounded-md px-3 transition-colors"
                  >
                    <div className="text-sm">{item.feature}</div>
                    <div className="text-center">
                      {item.gostman === "✓" ? (
                        <div className="inline-flex items-center justify-center">
                          <Check className="h-5 w-5 text-emerald-400/70" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60">{item.gostman}</span>
                      )}
                    </div>
                    <div className="text-center">
                      {item.others === "✓" ? (
                        <div className="inline-flex items-center justify-center">
                          <Check className="h-5 w-5 text-emerald-400/70" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/30" strokeWidth={2} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Gostman Logo" className="h-8 w-8 rounded-md" />
              <div>
                <span className="font-medium text-sm">Gostman</span>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  A lightweight HTTP client for developers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <a
                href="https://github.com/krockxz/gostman"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <a
                href="https://github.com/krockxz/gostman/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                Report Issue
              </a>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/40 text-center">
            <p className="text-sm text-muted-foreground/60">
              © 2025 Gostman. Open source, always free.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
