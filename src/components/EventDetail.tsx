import { motion } from 'framer-motion'

// Split event detail text into segments, highlighting numeric runs with a
// short accent-to-default color fade. Catches integers, decimals, and
// composite tokens like "WO-2026-518" or "1.42×".
const NUMBER_RE = /([0-9]+(?:[.,][0-9]+)*(?:%|°|°C|×|x|bar|kW|kWh|MWh|kV)?)/g

export function EventDetail({ text }: { text: string }) {
  const parts = text.split(NUMBER_RE)
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 1) {
          return (
            <motion.span
              key={i}
              initial={{ color: 'var(--accent)' }}
              animate={{ color: 'var(--text-dim)' }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{ fontWeight: 600 }}
            >
              {p}
            </motion.span>
          )
        }
        return <span key={i}>{p}</span>
      })}
    </>
  )
}
