import { TIMER_MAX_MINUTES, TIMER_MIN_MINUTES } from '../types/spy.types';
import './TimerSlider.css';

interface TimerSliderProps {
  minutes: number;
  onChange: (minutes: number) => void;
}

const toFarsiDigits = (n: number) => new Intl.NumberFormat('fa-IR').format(n);
const marks = [3, 6, 9, 12, 15];

export default function TimerSlider({ minutes, onChange }: TimerSliderProps) {
  return (
    <section className="timer-slider">
      <div className="timer-slider-header">
        <h2 className="timer-slider-title">زمان بازی</h2>
        <span className="timer-slider-value">{toFarsiDigits(minutes)} دقیقه</span>
      </div>

      <div className="timer-slider-box sketch-border">
        <input
          type="range"
          min={TIMER_MIN_MINUTES}
          max={TIMER_MAX_MINUTES}
          value={minutes}
          onChange={e => onChange(Number(e.target.value))}
          className="timer-slider-input"
        />
        <div className="timer-slider-marks">
          {marks.map(m => (
            <span key={m}>{toFarsiDigits(m)}</span>
          ))}
        </div>
      </div>
    </section>
  );
}