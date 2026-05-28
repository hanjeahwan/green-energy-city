import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  format?: (n: number) => string
  duration?: number
  className?: string
}

const defaultFormat = (n: number) => String(Math.round(n))

// Smooth-tween a numeric value to its new target on every `value` change.
// Used by HUD pills (latency / agents / power / tokens) to replace 1Hz hard jumps.
export function AnimatedNumber({
  value,
  format = defaultFormat,
  duration = 0.6,
  className,
}: AnimatedNumberProps) {
  const mv = useMotionValue(value)
  const [text, setText] = useState(() => format(value))
  const prev = useRef(value)

  useEffect(() => {
    const controls = animate(mv, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setText(format(latest)),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, duration, format, mv])

  return <motion.span className={className}>{text}</motion.span>
}
