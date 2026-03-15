export interface ConnectProvider {
  send<T>(data: string, options: Record<string, unknown>): Promise<T>;
  listen(cb: (...args: unknown[]) => void): Promise<void>;
  destroy(): void;
}
