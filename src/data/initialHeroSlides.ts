import { HeroSlide } from '../types';

export const INITIAL_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    title: 'Heritage Jamdani & Silk Sarees',
    subtitle: 'Hand-woven elegance from Dhakai artisans with golden zari motifs for festive and bridal celebrations.',
    category: 'sarees',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    cta: 'Explore Sarees',
    order: 1,
    isActive: true,
  },
  {
    id: 'slide-2',
    title: 'Luxury 3-Piece Embroidered Kurtis',
    subtitle: 'Exquisite needlework, breathable slub cotton & pure linen paired with coordinated dupattas.',
    category: 'kurtis',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
    cta: 'Shop Kurtis',
    order: 2,
    isActive: true,
  },
  {
    id: 'slide-3',
    title: 'Dubai Cut Flared Abayas & Borka',
    subtitle: 'Premium Korean Nida cloth silhouettes with matching chiffon hijabs for modest, graceful everyday comfort.',
    category: 'abayas',
    image: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=1200&q=80',
    cta: 'View Abayas',
    order: 3,
    isActive: true,
  },
];
