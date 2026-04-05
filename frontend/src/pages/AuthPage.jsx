import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const AuthPage = () => {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.state?.isLogin === false ? false : true);

  useEffect(() => {
    if (location.state?.isLogin === false) {
      setIsLogin(false);
    }
  }, [location.state?.isLogin]);

  return (
    <div className="min-h-screen bg-primary font-body text-blue-50 selection:bg-primary-fixed selection:text-on-primary-fixed flex items-center justify-center relative overflow-hidden">

      {/* Background elements from Landing Page */}
      <div className="absolute inset-0 z-0">
        <img alt="Modern abstract background" className="w-full h-full object-cover object-center opacity-30 grayscale scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsmFFoLNx6fRXaTxwTBZt9njBfim9eQJCcY5-q-o-rJJ23nnbtL4f7L5dP4zXJbYi0wZpEdD1Yma1eeCxT2gvy8cwwGWAnMS6M4xmrnjS4uJ5n_RI-o11U98YoZvFh_iPJTEgr-_ZdAe2kOT_6OWsH4Gb-GxzZHxB3f4cnLy6eLI81pzOJVyZyJucaeyuppYOMEyG1INhZyT12X-jfW9ZvNCTJdbVTabHsTpDPv9ekEf7Gm8O78LoloqB-nMkGv6KSe0zz11b5zXK4" />
        <div className="absolute inset-0 hero-bg-overlay"></div>
        <div className="absolute inset-0 hero-glow"></div>
      </div>

      {/* Top Nav Minimal */}
      <nav className="absolute top-0 w-full z-50">
        <div className="flex justify-between items-center px-8 md:px-16 py-8 w-full max-w-480uto">
          <Link to="/" className="text-xl font-bold tracking-tighter text-blue-50 font-headline hover:text-white transition-colors">MoneyMentor</Link>
        </div>
      </nav>

      {/* Main Content Card container */}
      <div className={`relative z-10 w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center ${isLogin ? 'mt-0' : 'mt-16 sm:mt-0'} pb-12 sm:pb-0`}>

        {/* Left Side: Editorial Typography */}
        <div className="hidden lg:flex flex-col">
          <h2 className="text-[10px] uppercase tracking-[0.4em] text-outline font-bold mb-4">Gamified Savings</h2>
          <h1 className="text-4xl lg:text-5xl xl:text-7xl font-headline font-bold tracking-tighter text-gradient leading-[1.1] mb-4">
            {isLogin ? "Level up your savings." : "Start your journey."}
          </h1>
          <p className="text-blue-100/60 text-lg leading-relaxed font-light max-w-md">
            {isLogin
              ? "Jump back into MoneyMentor to track your progress, complete daily challenges, and hit your financial goals."
              : "Join our community today to build healthy money habits through fun challenges and rewards!"}
          </p>
        </div>

        {/* Right Side: Glassmorphism / Sleek Form Panel */}
        <div className={`w-full mx-auto relative mt-16 lg:mt-0 transition-all duration-500 ${isLogin ? 'max-w-md' : 'max-w-sxl'}`}>
          {/* Decorative corner accents */}
          <div className="absolute -top-px -left-px w-6 h-px bg-blue-400"></div>
          <div className="absolute -top-px -left-px w-px h-6 bg-blue-400"></div>

          <div className="bg-surface-bright/5 backdrop-blur-2xl border border-white/10 p-8 md:p-12 shadow-2xl relative overflow-hidden">

            {/* Header */}
            <div className="mb-12 text-left">
              <h3 className="text-3xl font-headline font-bold text-white mb-2 tracking-tight">
                {isLogin ? 'Login' : 'Sign Up'}
              </h3>
              <p className="font-label text-blue-100/40 tracking-[0.2em] text-[10px] uppercase">
                {isLogin ? 'Welcome back to MoneyMentor' : 'Create your free account'}
              </p>
            </div>

            {/* Form injected here */}
            {isLogin ? <LoginForm /> : <RegisterForm />}

            {/* Footer Toggle */}
            <div className="mt-12 pt-8 border-t border-white/10 text-center">
              <p className="font-label text-[9px] uppercase tracking-widest text-blue-100/40">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-white hover:text-blue-300 transition-colors tracking-[0.2em] ml-2 font-bold focus:outline-none"
                >
                  {isLogin ? 'SIGN UP HERE' : 'LOGIN INSTEAD'}
                </button>
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AuthPage;