import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import clinicImage from '../assets/VIVREFRONT (3).png';
import logoBlack from '../assets/vivre-black.png';
import LoginModal from '../components/LoginModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // 1. Logic for "Book an Appointment" button
  const handleBookingClick = () => {
    const isLoggedIn = localStorage.getItem('user');
    if (isLoggedIn) {
      navigate('/patient-dashboard');
    } else {
      setIsLoginOpen(true);
    }
  };

  // 2. Logic for the User Icon on the Navbar
  const handleUserIconClick = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      // If logged in, go to the profile page (Content Management Module)
      navigate('/profile');
    } else {
      // If not logged in, open the login modal
      setIsLoginOpen(true);
    }
  };
  return (
    <div className="min-h-screen bg-[#faf9f6] font-sans text-gray-800 relative">
      
      {/* 1. The Modal Overlay (Only shows when isLoginOpen is true) */}
      {isLoginOpen && (
        <LoginModal onClose={() => setIsLoginOpen(false)} />
      )}
      
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center">
          {/* Increased Nav Logo Size */}
          <img src={logoBlack} alt="Vivre Logo" className="h-24 w-auto object-contain" />
        </div>

        <div className="hidden md:flex gap-10 text-xs uppercase tracking-widest font-medium">
          <a href="#" className="text-[#d4af37] border-b border-[#d4af37] pb-1">Home</a>
          <a href="#" className="text-[#8c8c8c] hover:text-[#2d2a26] transition duration-300">Services</a>
          <a href="#" className="text-[#8c8c8c] hover:text-[#2d2a26] transition duration-300">Clinics</a>
          <a href="#" className="text-[#8c8c8c] hover:text-[#2d2a26] transition duration-300">Contact Us</a>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => setIsLoginOpen(true)} className="w-10 h-10 bg-[#f4f1eb] rounded-full flex items-center justify-center hover:bg-[#eae5d9] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          <button 
  onClick={handleUserIconClick}
  className="w-10 h-10 bg-[#f4f1eb] rounded-full flex items-center justify-center hover:bg-[#eae5d9] transition"
>
            <svg className="w-5 h-5 text-[#2d2a26]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        <div className="w-full md:w-1/2 lg:w-[55%] h-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent z-10"></div>
          <img src={clinicImage} alt="Vivre Clinic Interior" className="w-full h-full object-cover" />
        </div>

        <div className="w-full md:w-1/2 lg:w-[45%] h-full flex flex-col justify-center px-10 lg:px-24 bg-gradient-to-br from-white to-[#fdfbf7]">
          {/* Significantly Larger Hero Logo */}
          <div className="mb-12">
            <img src={logoBlack} alt="Vivre Medical Group" className="h-36 w-auto object-contain" />
          </div>

          <p className="text-[#595959] text-lg lg:text-xl mb-6 leading-relaxed font-light">
            Experience advanced skincare solutions with cutting-edge treatments designed for your beauty and wellness.
          </p>
          
          <p className="text-[#595959] text-lg lg:text-xl mb-10 leading-relaxed font-light">
            Your journey to healthy, radiant skin starts here.
          </p>

          {/* New Call to Action Button */}
          <div>
            <button 
              onClick={handleBookingClick}
              className="px-10 py-4 bg-[#2d2a26] text-[#d4af37] text-xs uppercase tracking-[0.2em] font-bold hover:bg-black transition duration-500 shadow-xl"
            >
              Book an Appointment
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;