export interface RagSettings {
  topK: number;
  tags: string;
}

const key = "helpdesk-pageindex-settings";

export const defaultSettings: RagSettings = {
  topK: 6,
  tags: ""
};

export function loadSettings(): RagSettings {
  if (typeof window === "undefined") return defaultSettings;
  const raw = window.localStorage.getItem(key);
  if (!raw) return defaultSettings;
  try {
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: RagSettings) {
  window.localStorage.setItem(key, JSON.stringify(settings));
}

export function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
