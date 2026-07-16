import './SpyCountStepper.css';

interface SpyCountStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
}

const toFarsiDigits = (n: number) => new Intl.NumberFormat('fa-IR').format(n);

export default function SpyCountStepper({ value, onChange, min = 1, max }: SpyCountStepperProps) {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <section className="spy-count">
      <h2 className="spy-count-title">تعداد جاسوس‌ها</h2>
      <div className="spy-count-control">
        <button type="button" className="spy-count-btn sketch-border" onClick={decrement} disabled={value <= min}>
          <span className="material-symbols-outlined">remove</span>
        </button>

        <div className="spy-count-value sketch-border">
          <span>{toFarsiDigits(value)}</span>
        </div>

        <button type="button" className="spy-count-btn sketch-border" onClick={increment} disabled={value >= max}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </section>
  );
}