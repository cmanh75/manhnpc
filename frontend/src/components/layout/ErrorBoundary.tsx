import { Component, type ErrorInfo, type ReactNode } from 'react'

const RELOAD_FLAG = 'manhnpc.chunk-reload-attempted'

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|failed to fetch|loading chunk|importing a module script failed/i.test(message)
}

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    // a stale tab referencing a JS chunk hash that no longer exists after a redeploy —
    // reload once to pick up the fresh index.html + manifest instead of showing a dead page
    if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1')
      window.location.reload()
      return
    }
    console.error('Unhandled render error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-svh place-items-center bg-void px-4 text-center">
          <div>
            <p className="font-mono text-sm text-muted">something broke while loading this page</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-white/8 px-4 py-2 font-mono text-xs text-ink ring-1 ring-white/15 transition hover:bg-cyan/15 hover:text-cyan"
            >
              reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
