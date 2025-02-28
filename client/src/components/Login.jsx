import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, User } from 'lucide-react';
import { supabase } from '../supabase';

function Login({ setIsLoggedIn, setUser }) {
  const [error, setError] = useState(null);

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'http://localhost:5173' },
      });
      if (error) throw error;
      console.log('Sign-in initiated:', data);
    } catch (err) {
      console.error('Google Sign-In Error:', err.message);
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const continueAsGuest = () => {
    setIsLoggedIn(false);
    console.log('Continuing as guest');
  };

  const directLogin = () => {
    setIsLoggedIn(false);
    console.log('Direct login without signing in');
  };

  console.log('Rendering enhanced Login component');
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col md:flex-row overflow-hidden"
      >
        {/* Left Section: Branding */}
        <div className="md:w-1/2 bg-gradient-to-br from-teal-500 to-teal-700 p-8 text-white flex flex-col justify-center items-center">
          <motion.div
            initial={{ rotate: -10, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-6"
          >
            <ShieldCheck size={64} />
          </motion.div>
          <h1 className="text-4xl font-extrabold tracking-tight">PI-Net CyberGuard</h1>
          <p className="mt-3 text-sm text-teal-100 text-center max-w-xs">
            Protect your digital world with cutting-edge tools and a thriving community.
          </p>
        </div>

        {/* Right Section: Login Options */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center items-center gap-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl font-semibold text-gray-800"
          >
            Get Started
          </motion.h2>
          <p className="text-center text-gray-500 text-sm max-w-md">
            Sign in with Google for full access, or explore as a guest with our core features.
          </p>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-600 text-sm bg-red-50 p-2 rounded-lg w-full text-center border border-red-200"
            >
              {error}
            </motion.p>
          )}

          {/* Buttons */}
          <div className="w-full space-y-4">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)' }}
              whileTap={{ scale: 0.97 }}
              onClick={signInWithGoogle}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-3 shadow-md transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4.01 20.07 7.68 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 4.01 3.93 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign In with Google
            </motion.button>
            <div className="flex gap-4 w-full">
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)' }}
                whileTap={{ scale: 0.97 }}
                onClick={directLogin}
                className="w-1/2 bg-gray-700 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <User size={18} />
                Login
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)' }}
                whileTap={{ scale: 0.97 }}
                onClick={continueAsGuest}
                className="w-1/2 bg-white hover:bg-gray-50 text-teal-600 border border-teal-600 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <ArrowRight size={18} />
                Continue as Guest
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;