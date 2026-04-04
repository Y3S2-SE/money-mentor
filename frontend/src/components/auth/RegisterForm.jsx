import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { register, clearMessage } from '../../store/slices/authSlice';

const CHECKS = [
    { label: 'At least 6 characters', test: (p) => p.length >= 6 },
    { label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter',  test: (p) => /[a-z]/.test(p) },
    { label: 'One number',            test: (p) => /\d/.test(p) },
];

const getStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    const passed = CHECKS.filter(c => c.test(password)).length;
    if (passed <= 1) return { score: 1, label: 'Weak',   color: '#ef4444' };
    if (passed === 2) return { score: 2, label: 'Fair',   color: '#f97316' };
    if (passed === 3) return { score: 3, label: 'Good',   color: '#eab308' };
    return             { score: 4, label: 'Strong', color: '#22c55e' };
};

const PasswordStrength = ({ password }) => {
    if (!password) return null;

    const strength = getStrength(password, CHECKS);

    return (
        <div className="mt-3 space-y-2.5">
            {/* Strength bar */}
            <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((level) => (
                        <div
                            key={level}
                            className="h-0.5 flex-1 rounded-full transition-all duration-300"
                            style={{
                                backgroundColor: strength.score >= level
                                    ? strength.color
                                    : 'rgba(255,255,255,0.1)',
                            }}
                        />
                    ))}
                </div>
                <span
                    className="font-label text-[9px] uppercase tracking-widest shrink-0 transition-colors duration-300"
                    style={{ color: strength.color }}
                >
                    {strength.label}
                </span>
            </div>

            {/* Requirement checklist */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {CHECKS.map(({ label, test }) => {
                    const passed = test(password);
                    return (
                        <div key={label} className="flex items-center gap-1.5">
                            <div
                                className="w-3 h-3 rounded-full flex items-center justify-center shrink-0
                                transition-all duration-200"
                                style={{
                                    backgroundColor: passed
                                        ? 'rgba(34,197,94,0.15)'
                                        : 'rgba(255,255,255,0.05)',
                                    border: passed
                                        ? '1px solid rgba(34,197,94,0.4)'
                                        : '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                {passed && (
                                    <svg className="w-1.5 h-1.5 text-green-400" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span
                                className="font-label text-[9px] uppercase tracking-wider transition-colors duration-200"
                                style={{
                                    color: passed
                                        ? 'rgba(134,239,172,0.8)'
                                        : 'rgba(255,255,255,0.25)',
                                }}
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, isError, isSuccess, message, user } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isSuccess && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
    if (isError && message) {
      setErrors({ submit: message });
    }
    return () => {
      dispatch(clearMessage());
    };
  }, [isSuccess, isError, message, user, navigate, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: '' }));
      dispatch(clearMessage());
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    const { confirmPassword, ...registrationData } = formData;
    dispatch(register(registrationData));
  };

  const inputContainerStyle = "relative group mb-6";
  const labelStyle = "font-label text-[10px] uppercase tracking-[0.2em] text-blue-100/50 mb-3 block transition-colors group-focus-within:text-blue-400";
  const inputStyle = (hasError) => `w-full bg-transparent border-b ${hasError ? 'border-red-500/50' : 'border-white/20'} py-3 focus:border-blue-400 focus:ring-0 transition-colors placeholder:text-white/10 text-base text-white outline-none`;

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
        <div className={inputContainerStyle}> 
        <label htmlFor="username" className={labelStyle}>Username</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="your_username"
          className={inputStyle(errors.username)}
        />
        {errors.username && (
          <p className="absolute -bottom-5 left-0 text-[9px] text-red-400 tracking-wider font-label uppercase">{errors.username}</p>
        )}
      </div>

      <div className={inputContainerStyle}>
        <label htmlFor="email" className={labelStyle}>Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          className={inputStyle(errors.email)}
        />
        {errors.email && <p className="absolute -bottom-5 left-0 text-[9px] text-red-400 tracking-wider font-label uppercase">{errors.email}</p>}
      </div>

      <div className="relative group mb-10">
        <label htmlFor="password" className={labelStyle}>Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••••"
            className={inputStyle(errors.password) + " pr-10 tracking-widest"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-2 focus:outline-none"
          >
            {showPassword ? (
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="absolute -bottom-5 left-0 text-[9px] text-red-400 tracking-wider font-label uppercase">{errors.password}</p>
        )}
        <PasswordStrength password={formData.password}/>
      </div>

      <div className={inputContainerStyle}>
        <label htmlFor="confirmPassword" className={labelStyle}>Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••••"
            className={inputStyle(errors.confirmPassword) + " pr-10 tracking-widest"}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-2 focus:outline-none"
          >
            {showConfirmPassword ? (
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            ) : (
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="absolute -bottom-5 left-0 text-[9px] text-red-400 tracking-wider font-label uppercase">{errors.confirmPassword}</p>
        )}
      </div>
      </div>

      {errors.submit && (
        <div className="pt-2">
          <p className="text-[10px] font-label uppercase tracking-widest text-red-500 text-center bg-red-500/10 py-3 px-4 border border-red-500/20">{errors.submit}</p>
        </div>
      )}

      <div className="pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-5 bg-white text-primary rounded-full font-label tracking-[0.2em] text-[11px] uppercase font-bold hover:bg-blue-50 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center justify-center"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
              CREATING ACCOUNT...
            </span>
          ) : (
            'CREATE ACCOUNT'
          )}
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;