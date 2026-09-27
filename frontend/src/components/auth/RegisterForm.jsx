import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { clearMessage, register } from '../../store/slices/authSlice';
import AuthField from './AuthField';
import GoogleAuthOption from './GoogleAuthOption';

const CHECKS = [
  { label: 'At least 6 characters', test: (password) => password.length >= 6 },
  { label: 'One uppercase letter', test: (password) => /[A-Z]/.test(password) },
  { label: 'One lowercase letter', test: (password) => /[a-z]/.test(password) },
  { label: 'One number', test: (password) => /\d/.test(password) }
];

const STRENGTH = [
  null,
  { label: 'Weak', color: 'bg-red-500', text: 'text-red-300' },
  { label: 'Fair', color: 'bg-orange-500', text: 'text-orange-300' },
  { label: 'Good', color: 'bg-yellow-500', text: 'text-yellow-300' },
  { label: 'Strong', color: 'bg-green-500', text: 'text-green-300' }
];

const PasswordStrength = ({ password }) => {
  if (!password) {
    return (
      <p id="password-help" className="mt-1.5 font-body text-[11px] leading-5 text-blue-100/70">
        Use at least 6 characters with uppercase, lowercase, and a number.
      </p>
    );
  }
  const passed = CHECKS.map(check => check.test(password));
  const score = Math.max(1, passed.filter(Boolean).length);
  const strength = STRENGTH[score];

  return (
    <div id="password-help" className="mt-2.5 rounded-xl border border-white/10 bg-primary/45 p-2.5">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map(level => (
            <span key={level} className={`h-1.5 flex-1 rounded-full ${level <= score ? strength.color : 'bg-blue-100/20'}`} />
          ))}
        </div>
        <span className={`font-label text-xs font-semibold ${strength.text}`}>{strength.label}</span>
      </div>
      <div className="mt-2.5 grid grid-cols-1 gap-x-3 gap-y-1 min-[360px]:grid-cols-2">
        {CHECKS.map((check, index) => (
          <div key={check.label} className={`flex items-center gap-2 font-body text-[11px] ${passed[index] ? 'text-green-200' : 'text-blue-100/70'}`}>
            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${passed[index] ? 'bg-green-400/15' : 'border border-blue-100/40'}`} aria-hidden="true">
              {passed[index] && <Check className="h-3 w-3" />}
            </span>
            {check.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, isError, isSuccess, message, user, googleAttemptId } = useSelector(state => state.auth);

  useEffect(() => {
    if (isSuccess && user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }, [isSuccess, user, navigate]);

  useEffect(() => () => {
    dispatch(clearMessage());
  }, [dispatch]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(previous => ({ ...previous, [name]: value }));
    if (errors[name] || errors.submit) {
      setErrors(previous => ({ ...previous, [name]: '', submit: '' }));
    }
    if (isError && message) dispatch(clearMessage());
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.username) {
      nextErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      nextErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      nextErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    if (!formData.email) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      nextErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }
    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (googleAttemptId) return;
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    dispatch(register({
      username: formData.username,
      email: formData.email,
      password: formData.password
    }));
  };

  const submitError = errors.submit || (isError && message ? message : '');
  const busy = isLoading || !!googleAttemptId;
  const localLoading = isLoading && !googleAttemptId;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4.5">
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          id="username"
          label="Username"
          value={formData.username}
          onChange={handleChange}
          placeholder="your_username"
          autoComplete="username"
          error={errors.username}
          disabled={busy}
        />
        <AuthField
          id="email"
          label="Email address"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
          disabled={busy}
        />
      </div>
      <AuthField
        id="password"
        label="Password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Create a password"
        autoComplete="new-password"
        error={errors.password}
        helpId="password-help"
        disabled={busy}
      >
        <PasswordStrength password={formData.password} />
      </AuthField>
      <AuthField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Repeat your password"
        autoComplete="new-password"
        error={errors.confirmPassword}
        disabled={busy}
      />

      {submitError && (
        <p role="alert" className="rounded-xl border border-red-300/35 bg-red-400/10 px-4 py-2.5 font-body text-sm leading-5 text-red-100">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        aria-busy={localLoading}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-fixed px-5 py-2.5 font-label text-sm font-semibold text-on-primary-fixed shadow-lg shadow-black/15 transition-all hover:bg-white hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-primary-fixed"
      >
        {localLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/80 border-t-transparent" aria-hidden="true" />}
        {localLoading ? 'Creating account...' : 'Create account'}
      </button>

      <GoogleAuthOption
        label="Sign up with Google"
        onStart={() => setErrors({})}
        onPopupError={(error) => setErrors({ submit: error })}
      />
    </form>
  );
};

export default RegisterForm;
