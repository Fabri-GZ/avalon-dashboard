"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = {
  hasError: boolean;
  message?: string;
  stack?: string;
  componentStack?: string;
};

export class DashboardErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message, stack: error.stack };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[DashboardErrorBoundary] crash caught", {
      message: error.message,
      digest: (error as { digest?: string }).digest,
      stack: error.stack,
      componentStack: info.componentStack,
    });
    this.setState({ componentStack: info.componentStack });
  }

  reset = () => {
    this.setState({ hasError: false, message: undefined, stack: undefined, componentStack: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ padding: 24, fontFamily: "monospace", color: "var(--foreground)" }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Error en el dashboard</h2>
        <p style={{ marginBottom: 16 }}>{this.state.message ?? "Unknown error"}</p>
        {this.state.componentStack && (
          <details open style={{ marginBottom: 16, fontSize: 12 }}>
            <summary>Component stack</summary>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{this.state.componentStack}</pre>
          </details>
        )}
        <button
          onClick={this.reset}
          style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }}
        >
          Reintentar
        </button>
      </div>
    );
  }
}
