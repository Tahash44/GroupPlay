import type { ReactNode } from 'react';
import './ui.css';

export default function ActionBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`ui-action-bar ${className}`.trim()}>{children}</div>;
}
