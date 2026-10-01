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
              <label className="block text-xs font-bold text-stone-700 mb-1">
                {authModalTab === 'login' ? 'Mobile Number or Email' : 'Email Address'}
              </label>
              <div className="relative">
                {authModalTab === 'login' ? (
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                ) : (
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                )}
                <input
                  type={authModalTab === 'login' ? 'text' : 'email'}
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={authModalTab === 'login' ? '01712345678 or name@example.com' : 'name@example.com'}
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
        </div>
      </div>
    </div>
  );
};
