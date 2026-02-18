import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    // Outer Frame
    <div className="min-h-screen flex items-center justify-center backdrop-blur-4xl bg-linear-to-br from-gray-900 via-black to-gray-800">
      {/* Card Container */}
      <div className="w-full max-w-240 bg-white border border-gray-500 rounded-[40px] min-h-170 shadow-2xl overflow-hidden flex flex-row">
        
        <div className="flex w-full flex-col md:flex-row">
          {/* Left Side - Hero Section */}
          <div className="relative w-full md:w-[46%] bg-black p-8 flex flex-col justify-start pt-24 overflow-hidden">
            <div className="relative z-10 text-white">
              <h1 className="text-3xl md:text-4xl font-normal tracking-tight leading-normal">
                Convert your ideas<br />
                into successful<br />
                business.
              </h1>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-100">
                {/* Main vertical streaks */}
                <div className="absolute -bottom-0.5 left-[20%]  w-24 h-75 bg-blue-600 blur-[60px] opacity-80 animate-blob"></div>
                <div className="absolute bottom-0 left-[30%] transform -translate-x-1/2 -translate-y-1/2 w-32 h-62.5 bg-blue-500 blur-[50px] opacity-60 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-20 h-50 bg-blue-700 blur-2xl opacity-50 animate-blob animation-delay-4000"></div>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="w-full md:w-[50%] bg-white p-12 md:p-12 flex flex-col justify-center">
            <div className="w-full max-w-md mx-auto">

              {/* Heading */}
              <div className="mb-6">
                <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Get Started'}
                </h2>
                <p className="text-gray-400 text-md">
                    Welcome to MoneyMentor — Let's get started
                </p>
              </div>

              <div className="border-t border-gray-300 w-[95%] mb-8"></div>

              {/* Forms */}
              {isLogin ? <LoginForm /> : <RegisterForm />}

              {/* Footer Toggle */}
              <div className="text-center mt-6">
                <p className="text-gray-500 text-sm font-medium">
                  {isLogin ? "Don't have an account? " : "Already have account? "}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-gray-900 font-bold hover:text-blue-700 hover:underline ml-1 cursor-pointer"
                  >
                    {isLogin ? 'Sign Up' : 'Login'}
                  </button>
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;