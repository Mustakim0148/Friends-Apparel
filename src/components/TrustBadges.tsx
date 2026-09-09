import React from 'react';
import { Truck, ShieldCheck, Banknote } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  const badges = [
    {
      icon: Truck,
      title: 'Fast Nationwide Delivery',
      desc: '1 Day in Dhaka • 3 Days outside Dhaka across all 64 districts',
    },
    {
      icon: Banknote,
      title: 'Cash on Delivery',
      desc: 'Pay cash upon parcel arrival right at your doorstep',
    },
    {
      icon: ShieldCheck,
      title: '100% Quality Assured',
      desc: 'Authentic Jamdani, pure silks, soft breathable cottons',
    },
  ];

  return (
    <div className="bg-white border-b border-rose-100 py-3.5 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
          {badges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="flex items-center sm:items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-xl bg-stone-50/70 border border-stone-100/90 hover:border-rose-200 transition-colors"
              >
                <div className="p-2 sm:p-2.5 rounded-lg bg-rose-50 text-rose-800 shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                    {badge.title}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-stone-500 mt-0.5 leading-relaxed">
                    {badge.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
