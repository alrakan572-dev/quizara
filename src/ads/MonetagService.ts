const SDK_ID = "quizara-monetag-sdk";
const SDK_URL = "https://libtl.com/sdk.js";
const SDK_FUNCTION = "show_11324128";
const ZONE_ID = 11324128;

export interface MonetagInAppSettings {
  frequency: number;
  capping: number;
  interval: number;
  timeout: number;
  everyPage: boolean;
}

type MonetagHandler = (options?: Record<string, unknown>) => Promise<void>;

declare global {
  interface Window {
    show_11324128?: MonetagHandler;
  }
}

function handler(): MonetagHandler | null {
  return typeof window.show_11324128 === "function"
    ? window.show_11324128
    : null;
}

function waitUntilReady(timeoutMs = 15000): Promise<MonetagHandler> {
  const current = handler();
  if (current) return Promise.resolve(current);

  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const ready = handler();
      if (ready) {
        window.clearInterval(timer);
        resolve(ready);
      } else if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(timer);
        reject(new Error("Monetag SDK did not become ready"));
      }
    }, 100);
  });
}

export const MonetagService = {
  async load(): Promise<void> {
    if (handler()) return;

    if (!document.getElementById(SDK_ID)) {
      const script = document.createElement("script");
      script.id = SDK_ID;
      script.src = SDK_URL;
      script.async = true;
      script.dataset.zone = String(ZONE_ID);
      script.dataset.sdk = SDK_FUNCTION;
      document.head.appendChild(script);
    }

    await waitUntilReady();
  },

  async showGameInterstitial(
    settings: MonetagInAppSettings,
  ): Promise<void> {
    await this.load();
    const show = await waitUntilReady();

    await show({
      type: "inApp",
      inAppSettings: settings,
    });
  },

  async preloadRewarded(ymid: string): Promise<void> {
    await this.load();
    const show = await waitUntilReady();
    await show({ type: "preload", ymid, requestVar: "lucky_box" });
  },

  async showRewardedInterstitial(ymid: string): Promise<void> {
    await this.load();
    const show = await waitUntilReady();
    await show({ ymid, requestVar: "lucky_box" });
  },
};
