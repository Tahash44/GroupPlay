export type AudioSettings = { volume: number; muted: boolean };

const STORAGE_KEY = 'bazigardan.audio-settings';
export const AUDIO_SETTINGS_EVENT = 'bazigardan-audio-settings-changed';
const defaults: AudioSettings = { volume: 0.7, muted: false };

type StorageAdapter = Pick<Storage, 'getItem' | 'setItem'>;

export function getAudioSettings(storage: StorageAdapter = window.localStorage): AudioSettings {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as Partial<AudioSettings> | null;
    return {
      volume: typeof parsed?.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : defaults.volume,
      muted: parsed?.muted === true,
    };
  } catch {
    return defaults;
  }
}

export function saveAudioSettings(settings: AudioSettings, storage: StorageAdapter = window.localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(AUDIO_SETTINGS_EVENT, { detail: settings }));
}
