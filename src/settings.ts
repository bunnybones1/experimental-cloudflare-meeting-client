import { Signal } from "./Signal";

let settings: Settings | undefined;

export function getSettings() {
  if (!settings) {
    settings = new Settings();
  }
  return settings;
}

const effectsStorageKey = "my-settings";

class Settings {
  ssrEnabled = true;
  bloomEnabled = true;
  fullRezEnabled = false;
  uiVisible = true;
  updateOutputNodeSignal = new Signal<void>();
  applyPixelRatioSignal = new Signal<void>();
  constructor() {
    // Load persisted settings here if needed
    this.loadStoredEffects();
  }

  loadStoredEffects = () => {
    try {
      const stored = localStorage.getItem(effectsStorageKey);
      if (!stored) return;
      const data = JSON.parse(stored) as Partial<{
        ssr: boolean;
        bloom: boolean;
        fullRez: boolean;
        uiVisible: boolean;
        music: boolean;
      }>;
      if (typeof data.ssr === "boolean") this.ssrEnabled = data.ssr;
      if (typeof data.bloom === "boolean") this.bloomEnabled = data.bloom;
      if (typeof data.fullRez === "boolean") this.fullRezEnabled = data.fullRez;
      if (typeof data.uiVisible === "boolean") this.uiVisible = data.uiVisible;
    } catch {
      // ignore malformed storage
    }
  };

  persistSettings = () => {
    try {
      localStorage.setItem(
        effectsStorageKey,
        JSON.stringify({
          ssr: this.ssrEnabled,
          bloom: this.bloomEnabled,
          fullRez: this.fullRezEnabled,
          uiVisible: this.uiVisible,
        })
      );
    } catch {
      // ignore storage failures
    }
  };

  setSSREnabled = (enabled: boolean) => {
    if (this.ssrEnabled === enabled) return;
    this.ssrEnabled = enabled;
    this.updateOutputNodeSignal.dispatch();
    this.persistSettings();
  };

  setBloomEnabled = (enabled: boolean) => {
    if (this.bloomEnabled === enabled) return;
    this.bloomEnabled = enabled;
    this.updateOutputNodeSignal.dispatch();
    this.persistSettings();
  };

  toggleSSR = () => this.setSSREnabled(!this.ssrEnabled);
  toggleBloom = () => this.setBloomEnabled(!this.bloomEnabled);
  setFullRezEnabled = (enabled: boolean) => {
    if (this.fullRezEnabled === enabled) return;
    this.fullRezEnabled = enabled;
    this.applyPixelRatioSignal.dispatch();
    this.updateOutputNodeSignal.dispatch();
    this.persistSettings();
  };
  toggleFullRez = () => this.setFullRezEnabled(!this.fullRezEnabled);
  setUIVisible = (visible: boolean) => {
    if (this.uiVisible === visible) return;
    this.uiVisible = visible;
    this.persistSettings();
  };
  toggleUIVisible = () => this.setUIVisible(!this.uiVisible);
}
