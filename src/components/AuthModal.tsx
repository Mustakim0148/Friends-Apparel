import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, Sparkles, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    loginCustomer,
    registerCustomer,
    googleSignIn,
  } = useShop();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authModalTab === 'login') {
        await loginCustomer(email, password);
      } else {
        const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        const normalizedPhone = phone.replace(/[০-৯]/g, d => String(banglaDigits.indexOf(d))).trim();
        await registerCustomer(email, password, name, normalizedPhone);
      }
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await googleSignIn();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-br from-rose-900 via-rose-800 to-rose-950 text-white relative">
          <button
            onClick={() => setIsAuthModalOpen(false)}
            id="auth-modal-close-btn"
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-rose-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-semibold uppercase tracking-widest text-rose-200">
              Friends Apparel
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold">
            {authModalTab === 'login' ? 'Customer Sign In' : 'Create an Account'}
          </h2>
          <p className="text-xs text-rose-200 mt-1">
            {authModalTab === 'login'
              ? 'Sign in to track orders, save favorites, and enjoy express checkout'
              : 'Join Friends Apparel for exclusive fashion updates and easy order tracking'}
          </p>

          {/* Toggle Tabs */}
          <div className="flex rounded-xl bg-black/20 p-1 mt-5">
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('login');
                setError(null);
              }}
              id="auth-tab-login"
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                authModalTab === 'login'
                  ? 'bg-white text-rose-950 shadow-xs'
                  : 'text-rose-200 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('register');
                setError(null);
              }}
              id="auth-tab-register"
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                authModalTab === 'register'
                  ? 'bg-white text-rose-950 shadow-xs'
                  : 'text-rose-200 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authModalTab === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Nusrat Jahan"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-rose-700 focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Mobile Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="01712345678"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-rose-700 focus:outline-hidden transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-rose-700 focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-rose-700 focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="auth-submit-btn"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {authModalTab === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider">
              or
            </span>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            id="google-signin-btn"
            className="w-full py-2.5 px-4 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 font-semibold text-xs sm:text-sm border border-stone-200 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};
