import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen bg-[#0a0f1c] text-white p-8 font-sans">
          <h1 className="text-xl font-bold text-red-400 mb-4">Something went wrong</h1>
          <pre className="bg-black/40 p-4 rounded-lg text-sm text-slate-300 overflow-auto max-h-[60vh]">
            {this.state.error.message}
          </pre>
          <pre className="mt-4 text-xs text-slate-500 overflow-auto">
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
