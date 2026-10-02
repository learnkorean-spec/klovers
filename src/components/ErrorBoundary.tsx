import { Component, ErrorInfo, ReactNode } from "react";
import { captureException } from "@/lib/sentry";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Forwarded with the React component stack as extra context. Sentry is
    // imported on demand inside `captureException` (see src/lib/sentry.ts), so
    // this stays correct whether or not the SDK ever loads — with no DSN
    // configured it is a resolved promise and nothing else. The component
    // stack is a string and is cheap to build, so it is passed unconditionally
    // rather than only when a DSN exists.
    captureException(error, {
      tag: "app",
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center p-8 text-center">
          <div className="space-y-4 max-w-md">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              className="px-4 py-2 text-sm bg-foreground text-background rounded-md hover:opacity-80 transition-opacity"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
