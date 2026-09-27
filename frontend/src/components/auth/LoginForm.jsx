import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearMessage, login } from '../../store/slices/authSlice';
import AuthField from './AuthField';
import GoogleAuthOption from './GoogleAuthOption';

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
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
    if (!formData.email) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Email is invalid';
    }
    if (!formData.password) nextErrors.password = 'Password is required';
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
    dispatch(login(formData));
  };

  const submitError = errors.submit || (isError && message ? message : '');
  const busy = isLoading || !!googleAttemptId;
  const localLoading = isLoading && !googleAttemptId;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
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
      <AuthField
        id="password"
        label="Password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Enter your password"
        autoComplete="current-password"
        error={errors.password}
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
        {localLoading ? 'Signing in...' : 'Sign in'}
      </button>

      <GoogleAuthOption
        label="Sign in with Google"
        onStart={() => setErrors({})}
        onPopupError={(error) => setErrors({ submit: error })}
      />
    </form>
  );
};

export default LoginForm;
