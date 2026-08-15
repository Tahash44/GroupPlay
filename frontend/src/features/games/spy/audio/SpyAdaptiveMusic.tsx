import { useEffect, useMemo, useRef } from 'react';
import { getSpyMusicVolumes, SPY_AUDIO_FILES, type SpyMusicVolumes } from './adaptiveMusic';
import { AUDIO_SETTINGS_EVENT, getAudioSettings, type AudioSettings } from '../../../settings/audioSettings';

type Props = {
  remainingSeconds: number;
  durationSeconds: number;
  isRunning: boolean;
  timesUp: boolean;
};

const FADE_MS = 900;

export default function SpyAdaptiveMusic({ remainingSeconds, durationSeconds, isRunning, timesUp }: Props) {
  const audioRefs = useRef<Record<keyof SpyMusicVolumes, HTMLAudioElement | null>>({
    ambient: null,
    pulse: null,
    tension: null,
    final: null,
  });
  const targetVolumes = useMemo(
    () => getSpyMusicVolumes(remainingSeconds, durationSeconds),
    [remainingSeconds, durationSeconds],
  );
  const settingsRef = useRef<AudioSettings>(getAudioSettings());

  useEffect(() => {
    const audios = Object.entries(SPY_AUDIO_FILES).map(([key, src]) => {
      const audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0;
      audioRefs.current[key as keyof SpyMusicVolumes] = audio;
      return audio;
    });
    return () => audios.forEach(audio => { audio.pause(); audio.src = ''; });
  }, []);

  useEffect(() => {
    const handleSettingsChange = (event: Event) => {
      settingsRef.current = (event as CustomEvent<AudioSettings>).detail ?? getAudioSettings();
    };
    window.addEventListener(AUDIO_SETTINGS_EVENT, handleSettingsChange);
    return () => window.removeEventListener(AUDIO_SETTINGS_EVENT, handleSettingsChange);
  }, []);

  useEffect(() => {
    const entries = Object.entries(targetVolumes) as Array<[keyof SpyMusicVolumes, number]>;
    entries.forEach(([key, target]) => {
      const audio = audioRefs.current[key];
      if (!audio) return;
      const startVolume = audio.volume;
      const startedAt = performance.now();
      const fade = window.setInterval(() => {
        const progress = Math.min(1, (performance.now() - startedAt) / FADE_MS);
        const effectiveTarget = settingsRef.current.muted ? 0 : target * settingsRef.current.volume;
        audio.volume = startVolume + (effectiveTarget - startVolume) * progress;
        if (progress === 1) window.clearInterval(fade);
      }, 50);
      if (isRunning && !timesUp && target > 0) void audio.play().catch(() => undefined);
      if (!isRunning || timesUp) audio.pause();
    });
  }, [targetVolumes, isRunning, timesUp]);

  return null;
}
