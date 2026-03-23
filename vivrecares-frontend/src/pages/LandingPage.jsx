import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import clinicImage from '../assets/VIVREFRONT (3).png';
import logoBlack from '../assets/vivre-black.png';
import LoginModal from '../components/LoginModal';
import ProfileAvatar from '../components/ProfileAvatar';
import { clearStoredSession, getStoredUser } from '../utils/session';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Added to control the menu

  // Check if a user is currently logged in
  const user = getStoredUser();

  // Logic for "Book an Appointment" button
  const handleBookingClick = () => {
    if (user) {
      if (user.role === 'Patient') {
        navigate('/request-appointment');
      } else if (user.role === 'Admin') {
        navigate('/admin/patients');
      } else if (user.role === 'Doctor') {
        navigate('/doctor/appointments');
      } else {
        navigate('/');
      }
    } else {
      setIsLoginOpen(true);
    }
  };

  // Logic to clear session and refresh
  const handleLogout = () => {
      clearStoredSession();
      setIsDropdownOpen(false);
      window.location.reload(); 
  };

  // Determine correct dashboard path based on role
  const dashboardRoute =
    user?.role === 'Admin'
      ? '/admin/patients'
      : user?.role === 'Doctor'
        ? '/doctor/appointments'
        : '/profile';
  const displayName = user?.nickname || user?.first_name || 'User';

  return (
    <div className="min-h-screen bg-[#faf9f6] font-sans text-gray-800 relative">
      
      {/* The Modal Overlay */}
      {isLoginOpen && (
        <LoginModal onClose={() => setIsLoginOpen(false)} />
      )}
      
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center">
          <img src={logoBlack} alt="Vivre Logo" className="h-24 w-auto object-contain" />
        </div>

        <div className="hidden md:flex gap-10 text-xs uppercase tracking-widest font-medium">
          <a href="#" className="text-[#d4af37] border-b border-[#d4af37] pb-1">Home</a>
          <a href="#" className="text-[#8c8c8c] hover:text-[#2d2a26] transition duration-300">Services</a>
          <a href="#" className="text-[#8c8c8c] hover:text-[#2d2a26] transition duration-300">Clinics</a>
          <a href="#" className="text-[#8c8c8c] hover:text-[#2d2a26] transition duration-300">Contact Us</a>
        </div>

        <div className="flex items-center gap-6">
          {/* Notification Icon */}
          <button className="w-10 h-10 bg-[#f4f1eb] rounded-full flex items-center justify-center hover:bg-[#eae5d9] transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          
          {/* Dynamic Profile Section */}
          {!user ? (
              // THIS IS THE LOGGED OUT STATE: Just a plain button that opens the Login Modal
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="w-10 h-10 bg-[#f4f1eb] rounded-full flex items-center justify-center hover:bg-[#eae5d9] transition"
              >
                <svg className="w-5 h-5 text-[#2d2a26]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
          ) : (
              // THIS IS THE LOGGED IN STATE: Shows the Avatar and Dropdown
              <div className="relative">
                  <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-3 focus:outline-none"
                  >
                      <div className="w-10 h-10 rounded-full border-2 border-[#d4af37] overflow-hidden bg-gray-200 hover:opacity-80 transition flex items-center justify-center">
                          <ProfileAvatar user={user} className="w-full h-full" textSize="text-sm" />
                      </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                          <div className="px-4 py-3 border-b border-gray-50">
                              <p className="text-sm text-gray-800 font-bold truncate">
                                {/* We check nickname first, then the older 'name' label, then first_name */}
                                Hi, {user?.nickname || user?.name || user?.first_name || 'User'}!
                              </p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest">{user.role}</p>
                          </div>
                          <Link 
                              to={dashboardRoute}
                              className="block px-4 py-2 text-sm text-gray-600 hover:bg-[#fcfaf5] hover:text-[#d4af37] transition"
                          >
                              My Dashboard
                          </Link>
                          <button 
                              onClick={handleLogout}
                              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                          >
                              Logout
                          </button>
                      </div>
                  )}
              </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex flex-col md:flex-row h-[calc(100vh-80px)]">
        <div className="w-full md:w-1/2 lg:w-[55%] h-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent z-10"></div>
          <img src={clinicImage} alt="Vivre Clinic Interior" className="w-full h-full object-cover" />
        </div>

        <div className="w-full md:w-1/2 lg:w-[45%] h-full flex flex-col justify-center px-10 lg:px-24 bg-gradient-to-br from-white to-[#fdfbf7]">
          <div className="mb-12">
            <img src={logoBlack} alt="Vivre Medical Group" className="h-36 w-auto object-contain" />
          </div>

          <p className="text-[#595959] text-lg lg:text-xl mb-6 leading-relaxed font-light">
            Experience advanced skincare solutions with cutting-edge treatments designed for your beauty and wellness.
          </p>
          
          <p className="text-[#595959] text-lg lg:text-xl mb-10 leading-relaxed font-light">
            Your journey to healthy, radiant skin starts here.
          </p>

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
