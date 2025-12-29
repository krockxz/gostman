
import React, { useState, useEffect } from "react"

export const TypingAnimation = ({ text, delay = 100 }) => {
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
