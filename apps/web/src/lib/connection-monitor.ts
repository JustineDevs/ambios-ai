import { requestOperation } from "@/lib/api-client";

export type ConnectionState = "connected" | "checking" | "disconnected";

type Listener = (state: ConnectionState) => void;

class ConnectionMonitor {
  private state: ConnectionState = "checking";
  private listeners: Set<Listener> = new Set();
  private checkInProgress = false;
  private backoffMs = 2000;
  private readonly initialBackoffMs = 2000;
  private readonly maxBackoffMs = 30000;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private apiEndpoint: string | null = null;

  getState(): ConnectionState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.listeners.forEach((listener) => {
        listener(newState);
      });
    }
  }

  onInfrastructureError(apiEndpoint: string): void {
    this.apiEndpoint = apiEndpoint;

    if (this.checkInProgress) {
      return;
    }

    this.checkInProgress = true;
    this.setState("checking");
    this.performHealthCheck();
  }

  private async performHealthCheck(): Promise<void> {
    if (!this.apiEndpoint) {
      this.checkInProgress = false;
      return;
    }

    try {
      const response = await requestOperation("getHealth", { cache: "no-store" });

      if (response.ok) {
        this.setState("connected");
        this.backoffMs = this.initialBackoffMs;
        this.checkInProgress = false;
        return;
      }
    } catch {
      // Health check failed, continue to disconnected state
    }

    this.setState("disconnected");
    this.scheduleNextCheck();
  }

  private scheduleNextCheck(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.performHealthCheck();
    }, this.backoffMs);

    this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
  }

  reset(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.checkInProgress = false;
    this.backoffMs = this.initialBackoffMs;
    this.setState("checking");
    if (this.apiEndpoint) void this.performHealthCheck();
  }
}

export const connectionMonitor = new ConnectionMonitor();
