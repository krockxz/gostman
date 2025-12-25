import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary shadow-sm",
        secondary:
          "border-border bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive/10 text-destructive shadow-sm",
        outline: "text-foreground border-border",
        // HTTP method badges - vibrant and distinctive
        get: "border-transparent bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-sm shadow-blue-500/5",
        post: "border-transparent bg-green-500/10 text-green-400 border-green-500/20 shadow-sm shadow-green-500/5",
        put: "border-transparent bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-sm shadow-orange-500/5",
        delete: "border-transparent bg-red-500/10 text-red-400 border-red-500/20 shadow-sm shadow-red-500/5",
        patch: "border-transparent bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-sm shadow-yellow-500/5",
        head: "border-transparent bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-sm shadow-purple-500/5",
        // Status badges
        success: "border-transparent bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        redirect: "border-transparent bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
        clientError: "border-transparent bg-amber-500/10 text-amber-400 border-amber-500/20",
        serverError: "border-transparent bg-red-500/10 text-red-400 border-red-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
