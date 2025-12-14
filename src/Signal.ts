import { SignalListener } from "./SignalListener";

export class Signal<T = void> {
  private listeners = new Set<SignalListener<T>>();
  private hasDispatched = false;
  private lastValue: T | undefined;

  /**
   * Notify listeners with a new value and remember it so new listeners get it immediately.
   */
  dispatch(value: T): void {
    this.lastValue = value;
    this.hasDispatched = true;
    for (const listener of this.listeners) {
      listener(value);
    }
  }

  /**
   * Register a listener. It will be immediately invoked with the most recent value (if any).
   * Returns an unsubscribe function.
   */
  add(listener: SignalListener<T>): () => void {
    this.listeners.add(listener);
    if (this.hasDispatched) {
      // lastValue is defined whenever hasDispatched is true, even if the stored value itself is undefined.
      listener(this.lastValue as T);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove all listeners.
   */
  clear(): void {
    this.listeners.clear();
  }
}
