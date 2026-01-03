/**
 * Shared Animation Utilities
 * Common Framer Motion variants and animation configurations
 */

// Staggered container animation - perfect for lists and grids
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

// Fade and slide up animation - standard item reveal
export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}

// Scale and fade animation - for modal-like content
export const scaleVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}

// Slide in from left - for sidebars
export const slideInLeft = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}

// Slide in from right - for drawers
export const slideInRight = {
  hidden: { x: 20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}

// Pulse glow animation - for active states
export const pulseGlow = {
  boxShadow: [
    '0 0 0 0px rgba(34, 211, 238, 0.4)',
    '0 0 0 10px rgba(34, 211, 238, 0)',
    '0 0 0 0px rgba(34, 211, 238, 0.4)',
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
  }
}

// Wave animation - for connection indicators
export const waveAnimation = {
  scale: [1, 1.1, 1],
  opacity: [0.5, 1, 0.5],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  }
}

// Spin animation - for loading states
export const spinAnimation = {
  rotate: 360,
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: "linear"
  }
}

// Bounce animation - for attention-grabbing elements
export const bounceAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 0.5,
    repeat: Infinity,
    repeatDelay: 1
  }
}

// Shake animation - for errors
export const shakeAnimation = {
  x: [0, -10, 10, -10, 10, 0],
  transition: {
    duration: 0.5
  }
}

// Typing indicator animation
export const typingDots = {
  display: "flex",
  gap: "4px"
}

export const typingDot = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5]
  },
  transition: {
    duration: 0.8,
    repeat: Infinity
  }
}

// Progress bar animation
export const progressShimmer = {
  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "linear"
  }
}

// Status indicator pulse
export const statusPulse = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity
  }
}

/**
 * Motion button wrapper props
 * Use this for consistent button animations
 */
export const buttonMotionProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 17 }
}

/**
 * Motion card wrapper props
 * Use this for consistent card hover effects
 */
export const cardMotionProps = {
  whileHover: {
    y: -2,
    boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.3)"
  },
  transition: { type: "spring", stiffness: 400, damping: 20 }
}

/**
 * Page transition variants
 * Use these for page/route transitions
 */
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const pageTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8
}

/**
 * Modal/dialog animation variants
 */
export const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

export const modalContent = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
}

/**
 * Layout animation config
 * Use with layout prop on motion.div
 */
export const layoutAnimation = {
  type: "spring",
  stiffness: 350,
  damping: 30
}
