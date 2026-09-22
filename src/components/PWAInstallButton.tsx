import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, X, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed as shortcut app or dismissed by user, don't show prompt banner
  if (isInstalled || dismissed) {
    return null;
  }

  // Android / Chrome / Edge flow
  if (isInstallable) {
    return (
      <div className="bg-gradient-to-r from-rose-900 to-stone-900 text-white px-3 py-2 text-xs border-b border-rose-800 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/app-shortcut-icon.png"
              alt="Friends Apparel Shortcut App Logo"
              className="w-7 h-7 rounded-lg object-cover border border-white/30 shrink-0 shadow-xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://files.catbox.moe/r4w5zt.jpg';
              }}
            />
            <div>
              <span className="font-bold text-white block leading-tight">
                Friends Apparel Shortcut App
              </span>
              <span className="text-[10px] text-rose-200 block leading-tight">
                ফোনে বা পিসিতে সহজে ব্যবহার করতে অ্যাপ ইনস্টল করুন
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={install}
              className="px-3 py-1.5 rounded-lg bg-white text-rose-950 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-rose-700" />
              <span>Install App</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-1 text-white/60 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <div className="bg-stone-900 text-white px-3 py-2 text-xs border-b border-stone-800 print:hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/app-shortcut-icon.png"
                alt="Friends Apparel Shortcut App Logo"
                className="w-7 h-7 rounded-lg object-cover border border-white/30 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://files.catbox.moe/r4w5zt.jpg';
                }}
              />
              <span className="text-[11px] font-medium text-stone-200">
                Install <strong>Friends Apparel</strong> on your iPhone / iPad home screen
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowIOSGuide(true)}
                className="px-2.5 py-1 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3 h-3" />
                <span>How to Install</span>
              </button>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="p-1 text-stone-400 hover:text-white rounded-md transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 text-stone-900 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <img
                  src="/app-shortcut-icon.png"
                  alt="Friends Apparel Logo"
                  className="w-12 h-12 rounded-2xl object-cover border border-stone-200 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://files.catbox.moe/r4w5zt.jpg';
                  }}
                />
                <div>
                  <h3 className="font-serif text-lg font-bold">Friends Apparel App</h3>
                  <p className="text-xs text-stone-500">iPhone / iPad Shortcut Installation</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-stone-700 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <p>
                    Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-rose-700" /> at the bottom or top of Safari browser.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-rose-700" />.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <p>
                    Tap <strong>Add</strong> in the top right corner. The Friends Apparel shortcut app will appear on your home screen with the official logo!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
