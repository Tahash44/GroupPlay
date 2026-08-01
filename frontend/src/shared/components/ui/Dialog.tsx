import { useEffect, useId, useRef, type ReactNode } from 'react';
import './ui.css';

interface DialogProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
  closeOnBackdrop?: boolean;
}

export default function Dialog({ title, description, onClose, children, actions, closeOnBackdrop = true }: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('[autofocus], input, button')?.focus());
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  return (
    <div className="ui-dialog__backdrop" onMouseDown={event => closeOnBackdrop && event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="ui-dialog friend-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="ui-dialog__handle" aria-hidden="true" />
        <header className="ui-dialog__header">
          <h2 id={titleId} className="ui-dialog__title">{title}</h2>
          {description && <p id={descriptionId} className="ui-dialog__description">{description}</p>}
        </header>
        <div className="ui-dialog__body">{children}</div>
        {actions && <footer className="ui-dialog__actions">{actions}</footer>}
      </div>
    </div>
  );
}
