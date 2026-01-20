
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Loader2, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

interface LoginPageProps {
  onViewChange: (view: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onViewChange }) => {
  const { login } = useStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    await login();
    setIsLoggingIn(false);
    onViewChange('home');
  };

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-[#050505] text-neutral-900 dark:text-white transition-colors duration-300">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-white dark:bg-[#0a0a0a] items-center justify-center border-r border-neutral-200 dark:border-white/5">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 dark:bg-orange-600/20 rounded-full blur-[100px] animate-pulse-slow"></div>
        
        <div className="relative z-10 max-w-lg px-8 text-center">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8 inline-block"
            >
                <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(249,115,22,0.4)]">
                    <PenTool size={40} className="text-white dark:text-black" />
                </div>
            </motion.div>
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl font-bold mb-6 tracking-tight text-neutral-900 dark:text-white"
            >
                Intelligence for the<br/>Modern Creator
            </motion.h2>
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-neutral-600 dark:text-neutral-400 text-lg leading-relaxed"
            >
                Access the world's most advanced autonomous content engine. 
                Draft, refine, and publish with military-grade precision.
            </motion.p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-neutral-50 dark:bg-[#050505]">
        <button 
            onClick={() => onViewChange('landing')}
            className="absolute top-8 left-8 text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-2 transition-colors text-sm font-medium"
        >
            <ArrowRight className="rotate-180" size={16} /> Back to Home
        </button>

        <div className="max-w-md w-full">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold mb-2 text-neutral-900 dark:text-white">Welcome Back</h1>
                <p className="text-neutral-500 mb-8">Sign in to your Lumina account to continue.</p>

                <button 
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="w-full bg-white dark:bg-white text-neutral-900 dark:text-black font-bold h-14 rounded-lg flex items-center justify-center gap-3 hover:bg-neutral-100 dark:hover:bg-neutral-200 border border-neutral-200 dark:border-transparent transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group shadow-sm"
                >
                    {isLoggingIn ? (
                        <Loader2 size={20} className="animate-spin text-neutral-600" />
                    ) : (
                        <>
                            <img 
                                src="https://www.svgrepo.com/show/475656/google-color.svg" 
                                alt="Google" 
                                className="w-6 h-6"
                            />
                            <span>Continue with Google</span>
                        </>
                    )}
                </button>

                <div className="my-8 flex items-center gap-4">
                    <div className="h-px bg-neutral-200 dark:bg-white/10 flex-1"></div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-600 font-mono uppercase">Secure Access</span>
                    <div className="h-px bg-neutral-200 dark:bg-white/10 flex-1"></div>
                </div>

                <div className="text-center">
                    <p className="text-xs text-neutral-500 dark:text-neutral-600 leading-relaxed">
                        By continuing, you acknowledge that Lumina AI utilizes autonomous agents 
                        to process data. Review our <span className="text-neutral-900 dark:text-neutral-400 hover:underline cursor-pointer">Terms of Service</span>.
                    </p>
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
