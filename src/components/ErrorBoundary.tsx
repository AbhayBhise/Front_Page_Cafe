import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Front Page Cafe UI ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = import.meta.env.BASE_URL || '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="container py-5 text-center" style={{ minHeight: '60vh' }}>
          <div className="card shadow-sm border-0 rounded-4 p-5 mx-auto" style={{ maxWidth: 540 }}>
            <div className="mb-3">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-subtle text-danger"
                style={{ width: 64, height: 64 }}
              >
                <i className="bi bi-exclamation-triangle-fill fs-2" />
              </span>
            </div>
            <h3 className="fw-bold mb-2">Something unexpected happened</h3>
            <p className="text-muted mb-4">
              We encountered a temporary interface issue. Our systems have logged this event.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
                <i className="bi bi-arrow-clockwise me-1" /> Reload Page
              </button>
              <button className="btn btn-primary" onClick={this.handleReset}>
                <i className="bi bi-house-door me-1" /> Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
