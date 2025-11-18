import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // In production, you could send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Check if we're in development by looking at the hostname
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-destructive">
                <AlertCircle className="w-8 h-8" />
                Something Went Wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  We encountered an unexpected error. This has been logged and we'll look into it.
                </p>
                <p className="text-sm text-muted-foreground">
                  You can try refreshing the page or returning to the home page.
                </p>
              </div>

              {isDevelopment && this.state.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-destructive">Error Details (Development Only):</p>
                  <pre className="text-xs text-destructive overflow-auto max-h-48">
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-border"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;