import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50 p-8">
          <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
            <h1 className="text-lg font-bold text-red-600 mb-2">Er is iets misgegaan</h1>
            <p className="text-sm text-gray-500 mb-4">
              De applicatie kon niet starten. Vernieuw de pagina of wis de browseropslag.
            </p>
            <pre className="text-xs bg-gray-50 rounded-xl p-4 overflow-auto text-red-500 max-h-48">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Opslag wissen en herladen
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
