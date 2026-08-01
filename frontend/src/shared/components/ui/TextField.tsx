import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import './ui.css';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | null;
  icon?: ReactNode;
  endAdornment?: ReactNode;
  hideLabel?: boolean;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, icon, endAdornment, hideLabel = false, id, className = '', dir = 'auto', ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <div className={`ui-field${error ? ' ui-field--error' : ''}`}>
      <label className={hideLabel ? 'sr-only' : 'ui-field__label'} htmlFor={inputId}>{label}</label>
      <div className="ui-field__control">
        {icon && <span className="ui-field__icon" aria-hidden="true">{icon}</span>}
        <input
          {...props}
          ref={ref}
          id={inputId}
          dir={dir}
          className={`ui-field__input ${className}`.trim()}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
        />
        {endAdornment}
      </div>
      {(error || hint) && <p id={messageId} className={error ? 'ui-field__error' : 'ui-field__hint'}>{error || hint}</p>}
    </div>
  );
});

export default TextField;
