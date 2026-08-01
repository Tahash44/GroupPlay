import type { ReactNode } from 'react';
import './ui.css';

interface StatePanelProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: 'neutral' | 'error';
  loading?: boolean;
}

export default function StatePanel({ title, description, icon, action, tone = 'neutral', loading = false }: StatePanelProps) {
  return (
    <section className={`ui-state ui-state--${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      {loading ? <span className="ui-spinner ui-state__icon" aria-label={title} /> : icon && <span className="ui-state__icon" aria-hidden="true">{icon}</span>}
      <h3 className="ui-state__title">{title}</h3>
      {description && <p className="ui-state__description">{description}</p>}
      {action}
    </section>
  );
}
