import { describe, expect, it } from 'vitest';
import { getAudioSettings, saveAudioSettings } from './audioSettings';

describe('audio settings', () => {
  it('stores and restores the music volume and mute state', () => {
    const storage = new Map<string, string>();
    const adapter = { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) };

    saveAudioSettings({ volume: 0.35, muted: true }, adapter);

    expect(getAudioSettings(adapter)).toEqual({ volume: 0.35, muted: true });
  });
});
