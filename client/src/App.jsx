import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, User } from 'lucide-react';
import CyberGuard from './components/CyberGuard';
import ParentalMonitor from './components/ParentalMonitor';
import ThreatDashboard from './components/ThreatDashboard';
import CommunityPosts from './components/CommunityPosts';
import CybersecurityNews from './components/CybersecurityNews'; // Added import
import Login from './components/Login';
import { supabase } from './supabase';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null = undecided, true = signed in, false = guest
  const [isParent, setIsParent] = useState(null);
  const [view, setView] = useState('cyberguard');
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    console.log('App mounted');
    const fetchUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session?.user) {
          setUser(session.user);
          setIsLoggedIn(true);
          console.log('User signed in:', session.user.email);
        } else {
          console.log('No user session, showing login page');
        }
      } catch (err) {
        console.error('Supabase session error:', err.message);
        setAuthError(err.message);
      }
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event);
      setUser(session?.user || null);
      setIsLoggedIn(session?.user ? true : isLoggedIn);
      setIsAuthModalOpen(false);
      if (event === 'SIGNED_IN') console.log('Signed in:', session?.user?.email);
      if (event === 'SIGNED_OUT') console.log('Signed out');
    });

    return () => {
      console.log('App unmounting');
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsLoggedIn(null); // Return to login page
      setView('cyberguard');
      setIsParent(null);
      console.log('Signed out successfully');
    } catch (err) {
      console.error('Sign out error:', err.message);
      setAuthError(err.message);
    }
  };

  // Optional Login Page
  if (isLoggedIn === null) {
    console.log('Rendering Login page');
    return <Login setIsLoggedIn={setIsLoggedIn} setUser={setUser} />;
  }

  // Parent Choice Screen
  if (isParent === null) {
    console.log('Rendering parent choice');
    return (
      <div className="min-h-screen bg-[#ffffff] text-[#1f2a44] flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="card flex flex-col gap-8 items-center w-full max-w-md p-8 bg-white rounded-lg shadow-md"
        >
          <ShieldCheck size={40} className="text-[#00c4b4]" />
          <h1 className="text-3xl font-bold text-[#1f2a44]">Welcome to PI-Net</h1>
          <p className="text-center text-[#6b7280]">Are you a parent?</p>
          <div className="flex space-x-4">
            <button
              onClick={() => setIsParent(true)}
              className="btn btn-primary bg-[#00c4b4] hover:bg-[#00a89a] text-white px-4 py-2 rounded"
            >
              Yes
            </button>
            <button
              onClick={() => setIsParent(false)}
              className="btn btn-secondary bg-[#6b7280] hover:bg-[#4b5563] text-white px-4 py-2 rounded"
            >
              No
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main App with Features
  console.log('Rendering main app, view:', view);
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1f2a44] flex flex-col">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full py-6 px-8 bg-white shadow-md sticky top-0 z-10"
      >
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#00c4b4] flex items-center">
            <ShieldCheck className="mr-2 w-8 h-8" /> PI-Net CyberGuard
          </h1>
          <div className="flex items-center gap-4">
            {user ? (
              <button
                onClick={handleSignOut}
                className="btn btn-secondary bg-[#6b7280] hover:bg-[#4b5563] text-white text-sm px-4 py-2 rounded"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="btn btn-outline text-sm text-[#00c4b4] border-[#00c4b4] hover:bg-[#00c4b4] hover:text-white flex items-center gap-2 px-4 py-2 rounded"
              >
                <User size={16} /> Sign In
              </button>
            )}
            <nav className="flex space-x-6">
              <button
                onClick={() => setView('cyberguard')}
                className={`btn ${view === 'cyberguard' ? 'btn-primary bg-[#00c4b4] text-white' : 'btn-secondary bg-[#6b7280] text-white'} px-4 py-2 rounded`}
              >
                CyberGuard
              </button>
              {!isParent && (
                <>
                  <button
                    onClick={() => setView('parental')}
                    className={`btn ${view === 'parental' ? 'btn-primary bg-[#00c4b4] text-white' : 'btn-secondary bg-[#6b7280] text-white'} px-4 py-2 rounded`}
                  >
                    Parental Monitor
                  </button>
                  <button
                    onClick={() => setView('dashboard')}
                    className={`btn ${view === 'dashboard' ? 'btn-primary bg-[#00c4b4] text-white' : 'btn-secondary bg-[#6b7280] text-white'} px-4 py-2 rounded`}
                  >
                    Threat Dashboard
                  </button>
                  <button
                    onClick={() => setView('news')}
                    className={`btn ${view === 'news' ? 'btn-primary bg-[#00c4b4] text-white' : 'btn-secondary bg-[#6b7280] text-white'} px-4 py-2 rounded`}
                  >
                    Cybersecurity News
                  </button>
                  <button
                    onClick={() => setView('community')}
                    className={`btn ${view === 'community' ? 'btn-primary bg-[#00c4b4] text-white' : 'btn-secondary bg-[#6b7280] text-white'} px-4 py-2 rounded`}
                  >
                    Community
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto flex-1 py-12 flex flex-col items-center">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center py-12 space-y-6 w-full"
        >
          <h2 className="text-5xl font-extrabold text-[#1f2a44]">Secure Your Digital World</h2>
          <p className="text-lg text-[#6b7280] max-w-2xl">
            Advanced AI-powered scanning, parental monitoring, news updates, and community discussions to keep you safe online. Sign in for full access!
          </p>
        </motion.section>

        <motion.div
          key={isParent ? 'parental' : view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          {isParent ? (
            <ParentalMonitor />
          ) : view === 'cyberguard' ? (
            <CyberGuard />
          ) : view === 'parental' ? (
            <ParentalMonitor />
          ) : view === 'dashboard' ? (
            <ThreatDashboard />
          ) : view === 'news' ? (
            <CybersecurityNews />
          ) : view === 'community' ? (
            <CommunityPosts />
          ) : (
            <p className="text-center text-[#6b7280]">Select a feature above</p>
          )}
        </motion.div>
      </main>

      {isAuthModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
          >
            <h3 className="text-xl font-semibold text-[#1f2a44] mb-4">Sign In / Sign Up</h3>
            <p className="text-sm text-[#6b7280] mb-6">Use your Google account to join our community and unlock additional features.</p>
            {authError && (
              <p className="text-red-500 text-sm mb-4">{authError}</p>
            )}
            <button
              onClick={async () => {
                try {
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: 'http://localhost:5173' },
                  });
                  if (error) throw error;
                } catch (error) {
                  console.error('Sign-in error:', error.message);
                  setAuthError(error.message || 'Failed to sign in with Google');
                }
              }}
              className="btn btn-primary w-full bg-[#00c4b4] hover:bg-[#00a89a] text-white flex items-center justify-center gap-2 px-4 py-2 rounded"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4.01 20.07 7.68 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.68 1 4.01 3.93 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign In with Google
            </button>
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="btn btn-secondary w-full mt-4 bg-[#6b7280] hover:bg-[#4b5563] text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default App;