export type SpyMusicVolumes = {
  ambient: number;
  pulse: number;
  tension: number;
  final: number;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function getSpyMusicVolumes(remainingSeconds: number, durationSeconds: number): SpyMusicVolumes {
  const remainingRatio = durationSeconds > 0 ? clamp(remainingSeconds / durationSeconds) : 0;

  if (remainingRatio <= 0.1) return { ambient: 0, pulse: 0, tension: 0, final: 1 };
  if (remainingRatio <= 0.3) return { ambient: 0, pulse: 0.35, tension: 0.8, final: 0 };
  if (remainingRatio <= 0.6) return { ambient: 0.45, pulse: 0.7, tension: 0, final: 0 };
  return { ambient: 1, pulse: 0, tension: 0, final: 0 };
}

export const SPY_AUDIO_FILES = {
  ambient: '/audio/spy/music_ambient.mp3',
  pulse: '/audio/spy/music_pulse.mp3',
  tension: '/audio/spy/music_tension.mp3',
  final: '/audio/spy/music_final.mp3',
} as const;
