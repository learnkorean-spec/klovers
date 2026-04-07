import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Optional label shown in the error card (e.g. "this game"). Defaults to "this page". */
  context?: string;
  /** Called when the user clicks retry — defaults to window.location.reload() */
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  message: string;
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Unknown error" };
  }

  handleRetry = () => {
    if (this.props.onRetry) {
      this.setState({ hasError: false, message: "" });
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const context = this.props.context ?? "this page";
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <h2 className="font-semibold text-foreground">Something went wrong with {context}</h2>
          <p className="text-sm text-muted-foreground max-w-xs">{this.state.message}</p>
          <Button onClick={this.handleRetry} variant="outline">Refresh</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
