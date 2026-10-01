import { District } from '../types';

export const INITIAL_DISTRICTS: District[] = [
  // Dhaka Division (13)
  { id: 'dhaka', name: 'Dhaka', bnName: 'ঢাকা', division: 'Dhaka', charge: 80 },
  { id: 'gazipur', name: 'Gazipur', bnName: 'গাজীপুর', division: 'Dhaka', charge: 150 },
  { id: 'narayanganj', name: 'Narayanganj', bnName: 'নারায়ণগঞ্জ', division: 'Dhaka', charge: 150 },
  { id: 'tangail', name: 'Tangail', bnName: 'টাঙ্গাইল', division: 'Dhaka', charge: 150 },
  { id: 'kishoreganj', name: 'Kishoreganj', bnName: 'কিশোরগঞ্জ', division: 'Dhaka', charge: 150 },
  { id: 'manikganj', name: 'Manikganj', bnName: 'মানিকগঞ্জ', division: 'Dhaka', charge: 150 },
  { id: 'munshiganj', name: 'Munshiganj', bnName: 'মুন্সীগঞ্জ', division: 'Dhaka', charge: 150 },
  { id: 'narsingdi', name: 'Narsingdi', bnName: 'নরসিংদী', division: 'Dhaka', charge: 150 },
  { id: 'faridpur', name: 'Faridpur', bnName: 'ফরিদপুর', division: 'Dhaka', charge: 150 },
  { id: 'gopalganj', name: 'Gopalganj', bnName: 'গোপালগঞ্জ', division: 'Dhaka', charge: 150 },
  { id: 'madaripur', name: 'Madaripur', bnName: 'মাদারীপুর', division: 'Dhaka', charge: 150 },
  { id: 'rajbari', name: 'Rajbari', bnName: 'রাজবাড়ী', division: 'Dhaka', charge: 150 },
  { id: 'shariatpur', name: 'Shariatpur', bnName: 'শরীয়তপুর', division: 'Dhaka', charge: 150 },

  // Chittagong Division (11)
  { id: 'chittagong', name: 'Chittagong', bnName: 'চট্টগ্রাম', division: 'Chittagong', charge: 150 },
  { id: 'coxs-bazar', name: "Cox's Bazar", bnName: 'কক্সবাজার', division: 'Chittagong', charge: 150 },
  { id: 'comilla', name: 'Comilla', bnName: 'কুমিল্লা', division: 'Chittagong', charge: 150 },
  { id: 'feni', name: 'Feni', bnName: 'ফেনী', division: 'Chittagong', charge: 150 },
  { id: 'brahmanbaria', name: 'Brahmanbaria', bnName: 'ব্রাহ্মণবাড়িয়া', division: 'Chittagong', charge: 150 },
  { id: 'chandpur', name: 'Chandpur', bnName: 'চাঁদপুর', division: 'Chittagong', charge: 150 },
  { id: 'noakhali', name: 'Noakhali', bnName: 'নোয়াখালী', division: 'Chittagong', charge: 150 },
  { id: 'lakshmipur', name: 'Lakshmipur', bnName: 'লক্ষ্মীপুর', division: 'Chittagong', charge: 150 },
  { id: 'rangamati', name: 'Rangamati', bnName: 'রাঙ্গামাটি', division: 'Chittagong', charge: 150 },
  { id: 'khagrachhari', name: 'Khagrachhari', bnName: 'খাগড়াছড়ি', division: 'Chittagong', charge: 150 },
  { id: 'bandarban', name: 'Bandarban', bnName: 'বান্দরবান', division: 'Chittagong', charge: 150 },

  // Rajshahi Division (8)
  { id: 'rajshahi', name: 'Rajshahi', bnName: 'রাজশাহী', division: 'Rajshahi', charge: 150 },
  { id: 'bogra', name: 'Bogra', bnName: 'বগুড়া', division: 'Rajshahi', charge: 150 },
  { id: 'joypurhat', name: 'Joypurhat', bnName: 'জয়পুরহাট', division: 'Rajshahi', charge: 150 },
  { id: 'naogaon', name: 'Naogaon', bnName: 'নওগাঁ', division: 'Rajshahi', charge: 150 },
  { id: 'natore', name: 'Natore', bnName: 'নাটোর', division: 'Rajshahi', charge: 150 },
  { id: 'chapai-nawabganj', name: 'Chapai Nawabganj', bnName: 'চাঁপাইনবাবগঞ্জ', division: 'Rajshahi', charge: 150 },
  { id: 'pabna', name: 'Pabna', bnName: 'পাবনা', division: 'Rajshahi', charge: 150 },
  { id: 'sirajganj', name: 'Sirajganj', bnName: 'সিরাজগঞ্জ', division: 'Rajshahi', charge: 150 },

  // Khulna Division (10)
  { id: 'khulna', name: 'Khulna', bnName: 'খুলনা', division: 'Khulna', charge: 150 },
  { id: 'bagerhat', name: 'Bagerhat', bnName: 'বাগেরহাট', division: 'Khulna', charge: 150 },
  { id: 'chuadanga', name: 'Chuadanga', bnName: 'চুয়াডাঙ্গা', division: 'Khulna', charge: 150 },
  { id: 'jessore', name: 'Jessore', bnName: 'যশোর', division: 'Khulna', charge: 150 },
  { id: 'jhenaidah', name: 'Jhenaidah', bnName: 'ঝিনাইদহ', division: 'Khulna', charge: 150 },
  { id: 'kushtia', name: 'Kushtia', bnName: 'কুষ্টিয়া', division: 'Khulna', charge: 150 },
  { id: 'magura', name: 'Magura', bnName: 'মাগুরা', division: 'Khulna', charge: 150 },
  { id: 'meherpur', name: 'Meherpur', bnName: 'মেহেরপুর', division: 'Khulna', charge: 150 },
  { id: 'narail', name: 'Narail', bnName: 'নড়াইল', division: 'Khulna', charge: 150 },
  { id: 'satkhira', name: 'Satkhira', bnName: 'সাতক্ষীরা', division: 'Khulna', charge: 150 },

  // Barisal Division (6)
  { id: 'barisal', name: 'Barisal', bnName: 'বরিশাল', division: 'Barisal', charge: 150 },
  { id: 'barguna', name: 'Barguna', bnName: 'বরগুনা', division: 'Barisal', charge: 150 },
  { id: 'bhola', name: 'Bhola', bnName: 'ভোলা', division: 'Barisal', charge: 150 },
  { id: 'jhalokati', name: 'Jhalokati', bnName: 'ঝালকাঠি', division: 'Barisal', charge: 150 },
  { id: 'patuakhali', name: 'Patuakhali', bnName: 'পটুয়াখালী', division: 'Barisal', charge: 150 },
  { id: 'pirojpur', name: 'Pirojpur', bnName: 'পিরোজপুর', division: 'Barisal', charge: 150 },

  // Sylhet Division (4)
  { id: 'sylhet', name: 'Sylhet', bnName: 'সিলেট', division: 'Sylhet', charge: 150 },
  { id: 'habiganj', name: 'Habiganj', bnName: 'হবিগঞ্জ', division: 'Sylhet', charge: 150 },
  { id: 'moulvibazar', name: 'Moulvibazar', bnName: 'মৌলভীবাজার', division: 'Sylhet', charge: 150 },
  { id: 'sunamganj', name: 'Sunamganj', bnName: 'সুনামগঞ্জ', division: 'Sylhet', charge: 150 },

  // Rangpur Division (8)
  { id: 'rangpur', name: 'Rangpur', bnName: 'রংপুর', division: 'Rangpur', charge: 150 },
  { id: 'dinajpur', name: 'Dinajpur', bnName: 'দিনাজপুর', division: 'Rangpur', charge: 150 },
  { id: 'gaibandha', name: 'Gaibandha', bnName: 'গাইবান্ধা', division: 'Rangpur', charge: 150 },
  { id: 'kurigram', name: 'Kurigram', bnName: 'কুড়িগ্রাম', division: 'Rangpur', charge: 150 },
  { id: 'lalmonirhat', name: 'Lalmonirhat', bnName: 'লালমনিরহাট', division: 'Rangpur', charge: 150 },
  { id: 'nilphamari', name: 'Nilphamari', bnName: 'নীলফামারী', division: 'Rangpur', charge: 150 },
  { id: 'panchagarh', name: 'Panchagarh', bnName: 'পঞ্চগড়', division: 'Rangpur', charge: 150 },
  { id: 'thakurgaon', name: 'Thakurgaon', bnName: 'ঠাকুরগাঁও', division: 'Rangpur', charge: 150 },

  // Mymensingh Division (4)
  { id: 'mymensingh', name: 'Mymensingh', bnName: 'ময়মনসিংহ', division: 'Mymensingh', charge: 150 },
  { id: 'jamalpur', name: 'Jamalpur', bnName: 'জামালপুর', division: 'Mymensingh', charge: 150 },
  { id: 'netrokona', name: 'Netrokona', bnName: 'নেত্রকোণা', division: 'Mymensingh', charge: 150 },
  { id: 'sherpur', name: 'Sherpur', bnName: 'শেরপুর', division: 'Mymensingh', charge: 150 },
];
