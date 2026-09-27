import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const AuthField = ({
  id, label, name = id, type = 'text', value, onChange, placeholder,
  autoComplete, error, helpId, disabled = false, children
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block font-label text-[13px] font-semibold text-blue-100/85">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={isPassword && showPassword ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoCapitalize={type === 'email' ? 'none' : undefined}
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={[error ? `${id}-error` : null, helpId].filter(Boolean).join(' ') || undefined}
          disabled={disabled}
          className={`block min-h-11 w-full rounded-xl border bg-primary/70 px-4 py-2.5 font-body text-sm text-white outline-none transition-colors placeholder:text-blue-100/55 focus:bg-primary focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-60 ${isPassword ? 'pr-12' : ''} ${error ? 'border-red-300/70 focus:border-blue-300' : 'border-blue-100/20 hover:border-blue-100/40 focus:border-blue-300'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(current => !current)}
            disabled={disabled}
            aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-2 my-auto flex h-10 w-10 items-center justify-center rounded-lg text-blue-100/65 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-1 font-body text-xs text-red-200">{error}</p>}
      {children}
    </div>
  );
};

export default AuthField;
