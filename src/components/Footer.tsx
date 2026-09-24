import React from 'react';
import { Sparkles, Phone, Mail, MessageCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Footer: React.FC = () => {
  const { categories, setSelectedCategory, setActiveView } = useShop();

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setActiveView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-stone-800 text-xs">
          {/* Brand Info (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="https://files.catbox.moe/9mleks.png"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/logo.png';
                }}
                alt="Friends Apparel"
                className="h-12 w-auto object-contain"
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-serif text-xl font-bold text-white tracking-tight">
                    Friends Apparel
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <p className="text-[11px] text-rose-400/90 tracking-wider uppercase font-semibold">
                  Exclusive Women's Clothing
                </p>
              </div>
            </div>

            <p className="text-stone-400 text-xs leading-relaxed max-w-md">
              At Friends Apparel we believe that quality fashion should be accessible to everyone. That’s why we bring you a wide range of stylish, premium-quality clothing at a reasonable price.
            </p>

            {/* Official Facebook & WhatsApp Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <a
                href="https://www.facebook.com/friendsapparelshop"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-facebook-link"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-xs shadow-md transition-all hover:translate-y-[-1px] cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Follow on Facebook</span>
              </a>

              <a
                href="https://wa.me/8801929600998"
                target="_blank"
                rel="noopener noreferrer"
                id="footer-whatsapp-link"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs shadow-md transition-all hover:translate-y-[-1px] cursor-pointer"
                title="Chat on WhatsApp: +8801929600998"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                <span>WhatsApp: +8801929600998</span>
              </a>
            </div>
          </div>

          {/* Dynamic Categories */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide">
              Categories
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li>
                <button
                  onClick={() => handleCategoryClick('all')}
                  className="hover:text-rose-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>All Collection</span>
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => handleCategoryClick(cat.id)}
                    className="hover:text-rose-400 transition-colors cursor-pointer text-left block truncate max-w-[240px]"
                    title={cat.name}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold text-white tracking-wide">
              Customer Support
            </h4>
            <ul className="space-y-2.5 text-stone-400">
              <li className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                <a
                  href="https://wa.me/8801929600998"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: +8801929600998
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <a href="tel:01929600998" className="hover:text-white transition-colors">
                  Hotline: 01929600998
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <a href="mailto:friendsapparelcare@gmail.com" className="hover:text-white transition-colors">
                  friendsapparelcare@gmail.com
                </a>
              </li>
              <li className="pt-2 text-[11px] text-stone-400">
                Payment: Cash on Delivery (Cash Only)
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar without fixed delivery rate clutter */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500">
          <p>© {new Date().getFullYear()} Friends Apparel Bangladesh. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.facebook.com/friendsapparelshop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-white transition-colors"
            >
              facebook.com/friendsapparelshop
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
