import { describe, expect, it } from 'vitest';
import { getSpyMusicVolumes } from './adaptiveMusic';

describe('getSpyMusicVolumes', () => {
  it('keeps the ambient layer dominant at the start of a round', () => {
    expect(getSpyMusicVolumes(300, 300)).toEqual({ ambient: 1, pulse: 0, tension: 0, final: 0 });
  });

  it('raises tension as the remaining time approaches the end', () => {
    expect(getSpyMusicVolumes(60, 300)).toEqual({ ambient: 0, pulse: 0.35, tension: 0.8, final: 0 });
  });

  it('uses the final layer during the last ten percent of the round', () => {
    expect(getSpyMusicVolumes(10, 100)).toEqual({ ambient: 0, pulse: 0, tension: 0, final: 1 });
  });
});
