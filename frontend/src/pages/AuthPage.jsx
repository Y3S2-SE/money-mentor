import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import logo from '../assets/logo.png';

const AuthPage = () => {
  const location = useLocation();
  const [selection, setSelection] = useState(null);
  const isLogin = selection?.locationKey === location.key
    ? selection.isLogin
    : location.state?.isLogin !== false;

  const toggleMode = () => {
    setSelection({ locationKey: location.key, isLogin: !isLogin });
  };

  return (
    <div className="relative isolate h-dvh overflow-x-hidden overflow-y-auto bg-primary font-body text-blue-50 selection:bg-primary-fixed selection:text-on-primary-fixed">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-40 top-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-linear-to-br from-transparent via-primary to-primary-container/70" />
      </div>

      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-4 sm:px-7 lg:px-10">
        <header className="flex shrink-0 items-center justify-between gap-4 py-2">
          <Link to="/" className="inline-flex items-center gap-3 rounded-lg font-headline text-lg font-bold tracking-tight text-white transition-colors hover:text-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:text-xl">
            <img src={logo} alt="" className="h-9 w-9 rounded-xl" />
            <span>MoneyMentor</span>
          </Link>
          <Link to="/" aria-label="Back to home" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 font-label text-xs font-medium text-blue-100/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:text-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back to home</span>
          </Link>
        </header>

        <main className="flex min-h-0 flex-1 items-center justify-center gap-10 lg:justify-between lg:gap-16">
          <div className="hidden max-w-xl lg:block lg:flex-1">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-blue-200/5 px-4 py-2 font-label text-xs font-semibold text-blue-100/85">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-300" aria-hidden="true" />
              Your money, moving forward
            </p>
            <h2 className="max-w-xl font-headline text-5xl font-bold leading-[1.1] tracking-tight text-gradient xl:text-6xl">
              Make every money move count.
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-blue-100/70">
              Stay on top of your finances, build better habits, and celebrate the progress you make along the way.
            </p>
            <div className="mt-10 flex items-center gap-4 border-t border-white/10 pt-6 font-label text-xs text-blue-100/55">
              <span className="h-px w-8 bg-blue-300/70" aria-hidden="true" />
              Small steps. Stronger habits.
            </div>
          </div>

          <section className="mx-auto max-h-full min-h-0 w-full max-w-[530px] overflow-y-auto rounded-2xl border border-white/15 bg-primary-container p-5 text-white shadow-[0_28px_90px_rgba(0,9,23,0.38)] sm:p-5 lg:p-6" aria-labelledby="auth-title">
            <div className="mb-5">
              <p className="mb-1.5 font-label text-[11px] font-bold uppercase tracking-[0.16em] text-primary-fixed-dim">
                {isLogin ? 'Good to see you again' : 'Start with MoneyMentor'}
              </p>
              <h1 id="auth-title" className="font-headline text-[18px] font-bold tracking-tight text-white sm:text-[2.1rem]">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="mt-1.5 max-w-md font-body text-xs leading-5 text-blue-100/75">
                {isLogin
                  ? 'Sign in to pick up where you left off.'
                  : 'Build better money habits with an account that grows with you.'}
              </p>
            </div>

            {isLogin ? <LoginForm /> : <RegisterForm />}

            <div className="mt-5 border-t border-white/15 pt-3 text-center font-body text-sm text-blue-100/75">
              {isLogin ? "New to MoneyMentor?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="rounded-sm font-semibold text-primary-fixed underline decoration-primary-fixed/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                {isLogin ? 'Create an account' : 'Sign in'}
              </button>
            </div>
          </section>
        </main>

        <footer className="shrink-0 py-4 text-center font-label text-xs text-blue-100/40 lg:text-left">
          A clearer path to your financial goals.
        </footer>
      </div>
    </div>
  );
};

export default AuthPage;
