import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Save, ShieldCheck } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import { updateProfile, changePassword, clearMessage } from '../store/slices/authSlice';
import { addToast } from '../store/slices/toastSlice';

// ── Password Strength (same logic as RegisterForm) ───────────────────────────
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
    const strength = getStrength(password);
    return (
        <div className="mt-3 space-y-2.5">
            <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((level) => (
                        <div
                            key={level}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                                backgroundColor: strength.score >= level
                                    ? strength.color
                                    : 'var(--color-outline-variant)',
                            }}
                        />
                    ))}
                </div>
                <span className="font-label text-[9px] uppercase tracking-widest shrink-0"
                    style={{ color: strength.color }}>
                    {strength.label}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {CHECKS.map(({ label, test }) => {
                    const passed = test(password);
                    return (
                        <div key={label} className="flex items-center gap-1.5">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center
                                shrink-0 transition-all duration-200 border
                                ${passed
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-surface-container border-outline-variant/30'
                                }`}>
                                {passed && (
                                    <svg className="w-2 h-2 text-green-500" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className={`font-label text-[9px] uppercase tracking-wider
                                transition-colors duration-200
                                ${passed ? 'text-green-600' : 'text-on-surface-variant/50'}`}>
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon: Icon, children }) => (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-outline-variant/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-on-primary-fixed" />
            </div>
            <h2 className="font-headline text-sm font-bold text-on-surface">{title}</h2>
        </div>
        <div className="px-5 sm:px-6 py-5">
            {children}
        </div>
    </div>
);

// ── Input Field ───────────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
    <div className="space-y-1.5">
        <label className="font-label text-[10px] uppercase tracking-widest
            text-on-surface-variant font-bold block">
            {label}
        </label>
        {children}
        {error && (
            <p className="font-label text-[9px] uppercase tracking-wider text-red-500">
                {error}
            </p>
        )}
    </div>
);

const inputClass = (hasError) =>
    `w-full px-4 py-3 rounded-xl border font-body text-sm text-on-surface
    bg-surface-container-low placeholder:text-on-surface-variant/40
    focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all
    ${hasError
        ? 'border-red-400/50 focus:border-red-400'
        : 'border-outline-variant/30 focus:border-primary/40'
    }`;

// ── Password Input ────────────────────────────────────────────────────────────
const PasswordInput = ({ value, onChange, placeholder, hasError, name }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={inputClass(hasError) + ' pr-11 tracking-widest'}
            />
            <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40
                    hover:text-on-surface-variant transition-colors"
            >
                {show
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                }
            </button>
        </div>
    );
};

// ── Main ProfilePage ──────────────────────────────────────────────────────────
const ProfilePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isLoading } = useSelector(state => state.auth);

    const [profileForm, setProfileForm] = useState({
        username: user?.username || '',
        email: user?.email || '',
    });
    const [profileErrors, setProfileErrors] = useState({});
    const [profileLoading, setProfileLoading] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [passwordLoading, setPasswordLoading] = useState(false);

    const initials = (name) => name?.slice(0, 2).toUpperCase() || '??';

    // ── Profile update ────────────────────────────────────────────────────────
    const validateProfile = () => {
        const errors = {};
        if (!profileForm.username) {
            errors.username = 'Username is required';
        } else if (profileForm.username.length < 3) {
            errors.username = 'Must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(profileForm.username)) {
            errors.username = 'Letters, numbers, and underscores only';
        }
        return errors;
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        const errors = validateProfile();
        if (Object.keys(errors).length > 0) {
            setProfileErrors(errors);
            return;
        }
        setProfileErrors({});
        setProfileLoading(true);
        try {
            const result = await dispatch(updateProfile({ username: profileForm.username }));
            if (updateProfile.fulfilled.match(result)) {
                dispatch(addToast({
                    type: 'success',
                    message: 'Profile updated!',
                    subMessage: 'Your details have been saved.',
                }));
            } else {
                dispatch(addToast({
                    type: 'error',
                    message: 'Update failed',
                    subMessage: result.payload || 'Please try again.',
                }));
            }
        } finally {
            setProfileLoading(false);
        }
    };

    // ── Password change ───────────────────────────────────────────────────────
    const validatePassword = () => {
        const errors = {};
        if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
        if (!passwordForm.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (passwordForm.newPassword.length < 6) {
            errors.newPassword = 'Must be at least 6 characters';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
            errors.newPassword = 'Must contain uppercase, lowercase, and number';
        }
        if (!passwordForm.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        return errors;
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const errors = validatePassword();
        if (Object.keys(errors).length > 0) {
            setPasswordErrors(errors);
            return;
        }
        setPasswordErrors({});
        setPasswordLoading(true);
        try {
            const result = await dispatch(changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            }));
            if (changePassword.fulfilled.match(result)) {
                dispatch(addToast({
                    type: 'success',
                    message: 'Password changed!',
                    subMessage: 'Your password has been updated.',
                }));
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                dispatch(addToast({
                    type: 'error',
                    message: 'Change failed',
                    subMessage: result.payload || 'Please try again.',
                }));
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <Sidebar>
            <div className="flex flex-col h-full bg-surface-bright pt-6 sm:pt-8 px-4 pb-8">

                {/* Header */}
                <div className="mb-6 px-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-on-surface-variant
                            hover:text-primary font-label text-[11px] uppercase tracking-wider
                            font-bold mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-blue-950 flex items-center
                            justify-center text-on-primary text-xl font-bold font-headline shrink-0">
                            {initials(user?.username)}
                        </div>

                        <div className="min-w-0"> 
                            <h1 className="font-headline text-lg sm:text-xl font-bold text-on-surface tracking-tight truncate">
                                {user?.username}
                            </h1>
                            <p className="font-body text-sm text-on-surface-variant mt-0.5 truncate">
                                {user?.email}
                            </p>
                            <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1
                                    rounded-lg bg-primary-fixed border border-primary-fixed-dim
                                    font-label text-[9px] uppercase tracking-widest font-bold
                                    text-on-primary-fixed">
                                {user?.role || 'user'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-2">
                    <div className="max-w-2xl space-y-4 pb-6">

                        {/* Profile Details */}
                        <SectionCard title="Profile Details" icon={User}>
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Username" error={profileErrors.username}>
                                        <input
                                            type="text"
                                            value={profileForm.username}
                                            onChange={(e) => {
                                                setProfileForm(p => ({ ...p, username: e.target.value }));
                                                if (profileErrors.username) setProfileErrors(p => ({ ...p, username: '' }));
                                            }}
                                            placeholder="your_username"
                                            className={inputClass(profileErrors.username)}
                                        />
                                    </Field>
                                    <Field label="Email Address (Permanent)" error={profileErrors.email}>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                value={profileForm.email}
                                                readOnly
                                                disabled
                                                className={`${inputClass(false)} opacity-60 cursor-not-allowed bg-surface-container-high border-dashed`}
                                            />
                                            <Lock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/30" />
                                        </div>
                                    </Field>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={profileLoading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-950
                                            text-on-primary rounded-xl font-label text-[11px] uppercase
                                            tracking-widest font-bold hover:bg-blue-950/90
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            transition-colors"
                                    >
                                        {profileLoading
                                            ? <span className="w-3.5 h-3.5 rounded-full border-2
                                                border-on-primary border-t-transparent animate-spin" />
                                            : <Save className="w-3.5 h-3.5" />
                                        }
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </SectionCard>

                        {/* Change Password */}
                        <SectionCard title="Change Password" icon={ShieldCheck}>
                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <Field label="Current Password" error={passwordErrors.currentPassword}>
                                    <PasswordInput
                                        name="currentPassword"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => {
                                            setPasswordForm(p => ({ ...p, currentPassword: e.target.value }));
                                            if (passwordErrors.currentPassword) setPasswordErrors(p => ({ ...p, currentPassword: '' }));
                                        }}
                                        placeholder="••••••••"
                                        hasError={!!passwordErrors.currentPassword}
                                    />
                                </Field>

                                <Field label="New Password" error={passwordErrors.newPassword}>
                                    <PasswordInput
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => {
                                            setPasswordForm(p => ({ ...p, newPassword: e.target.value }));
                                            if (passwordErrors.newPassword) setPasswordErrors(p => ({ ...p, newPassword: '' }));
                                        }}
                                        placeholder="••••••••"
                                        hasError={!!passwordErrors.newPassword}
                                    />
                                    <PasswordStrength password={passwordForm.newPassword} />
                                </Field>

                                <Field label="Confirm New Password" error={passwordErrors.confirmPassword}>
                                    <PasswordInput
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => {
                                            setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }));
                                            if (passwordErrors.confirmPassword) setPasswordErrors(p => ({ ...p, confirmPassword: '' }));
                                        }}
                                        placeholder="••••••••"
                                        hasError={!!passwordErrors.confirmPassword}
                                    />
                                    {/* Match indicator */}
                                    {passwordForm.confirmPassword && passwordForm.newPassword && (
                                        <p className={`font-label text-[9px] uppercase tracking-wider mt-1.5
                                            ${passwordForm.newPassword === passwordForm.confirmPassword
                                                ? 'text-green-600'
                                                : 'text-red-500'
                                            }`}>
                                            {passwordForm.newPassword === passwordForm.confirmPassword
                                                ? '✓ Passwords match'
                                                : '✗ Passwords do not match'
                                            }
                                        </p>
                                    )}
                                </Field>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-950
                                            text-on-primary rounded-xl font-label text-[11px] uppercase
                                            tracking-widest font-bold hover:bg-blue-950/90
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            transition-colors"
                                    >
                                        {passwordLoading
                                            ? <span className="w-3.5 h-3.5 rounded-full border-2
                                                border-on-primary border-t-transparent animate-spin" />
                                            : <ShieldCheck className="w-3.5 h-3.5" />
                                        }
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </SectionCard>

                    </div>
                </div>
            </div>
        </Sidebar>
    );
};

export default ProfilePage;