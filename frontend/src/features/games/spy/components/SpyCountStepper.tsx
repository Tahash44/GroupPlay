import './SpyCountStepper.css';
import Icon from '../../../../shared/components/Icon/Icon';

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
        <button
          type="button"
          className="spy-count-btn sketch-border"
          aria-label="افزایش تعداد جاسوس"
          onClick={increment}
          disabled={value >= max}
        >
          <Icon name="add" />
        </button>

        <div className="spy-count-value sketch-border">
          <span>{toFarsiDigits(value)}</span>
        </div>

        <button
          type="button"
          className="spy-count-btn sketch-border"
          aria-label="کاهش تعداد جاسوس"
          onClick={decrement}
          disabled={value <= min}
        >
          <Icon name="remove" />
        </button>
      </div>
    </section>
  );
}
