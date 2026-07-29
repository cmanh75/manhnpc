import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

const bootLines = [
  { text: '$ manhnpc --boot', delay: 0 },
  { text: '[ok] loading personal universe v2.0', delay: 200 },
  { text: '[ok] mounting /memories … 9 countries found', delay: 400 },
  { text: '[ok] spinning up planet earth (9,015 dots)', delay: 600 },
  { text: '[ok] establishing uplink to hanoi, vietnam', delay: 800 },
  { text: '> welcome, traveler', delay: 1000 },
]

export function Preloader() {
  const booted = useAppStore((s) => s.booted)
  const setBooted = useAppStore((s) => s.setBooted)
  const [visibleLines, setVisibleLines] = useState(0)

  useEffect(() => {
    if (booted) return
    const timers = bootLines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay),
    )
    const done = setTimeout(() => setBooted(), 1250)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(done)
    }
  }, [booted, setBooted])

  return (
    <AnimatePresence>
      {!booted && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-void"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="w-[min(30rem,90vw)] font-mono text-sm">
            <div className="glass-strong rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-pink/80" />
                <span className="size-2.5 rounded-full bg-amber/80" />
                <span className="size-2.5 rounded-full bg-mint/80" />
                <span className="ml-3 text-xs text-faint">boot.sh</span>
              </div>
              {bootLines.slice(0, visibleLines).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={
                    line.text.startsWith('>')
                      ? 'mt-2 text-cyan'
                      : line.text.startsWith('$')
                        ? 'text-ink'
                        : 'text-muted'
                  }
                >
                  {line.text.startsWith('[ok]') ? (
                    <>
                      <span className="text-mint">[ok]</span>
                      {line.text.slice(4)}
                    </>
                  ) : (
                    line.text
                  )}
                </motion.div>
              ))}
              <span className="mt-1 inline-block h-4 w-2 animate-blink bg-cyan align-middle" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
