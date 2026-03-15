import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import logoBlack from '../assets/vivre-black.png';
import ProfileAvatar from './ProfileAvatar';
import NotificationBell from './NotificationBell';

const PatientLayout = () => {
    const navigate = useNavigate();
    const location = useLocation(); // This tells us which page we are on
    const user = JSON.parse(localStorage.getItem('user'));

    // Fallback logic just in case the login API named the variables differently
    const displayName = user?.nickname || user?.first_name || user?.name || "Patient";

    const handleMenuClick = (path) => {
        // Only navigate if the user is NOT already on this exact path
        if (location.pathname !== path) {
            navigate(path);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#faf9f6] font-sans">
            {/* Fixed Sidebar */}
            <aside className="w-64 bg-[#4d4d4d] text-white flex flex-col py-12 sticky top-0 h-screen">
                <div className="flex flex-col items-center px-6 mb-12">
                    <div className="w-24 h-24 rounded-full border-2 border-[#d4af37] overflow-hidden mb-4 bg-gray-200">
                        {/* Will add actual photo path later when upload is done */}
                        <ProfileAvatar user={user} className="w-full h-full" />
                    </div>
                    <h3 className="text-sm font-light tracking-widest text-center uppercase">
                        Good day,<br/> 
                        <span className="font-bold text-lg">{displayName}!</span>
                    </h3>
                </div>

                <nav className="w-full flex flex-col space-y-1">
                    <SidebarButton 
                        label="Patient Profile" 
                        active={location.pathname === '/profile'} 
                        onClick={() => handleMenuClick('/profile')} 
                    />
                    <SidebarButton 
                        label="Request for Appointment" 
                        active={location.pathname === '/request-appointment'} 
                        onClick={() => handleMenuClick('/request-appointment')} 
                    />
                    <SidebarButton 
                        label="Appointment History" 
                        active={location.pathname === '/appointment-history'} 
                        onClick={() => handleMenuClick('/appointment-history')} 
                    />
                    <SidebarButton 
                        label="Billing History" 
                        active={location.pathname === '/billing-history'} 
                        onClick={() => handleMenuClick('/billing-history')} 
                    />
                    <SidebarButton 
                        label="Account Settings" 
                        active={location.pathname === '/account-settings'} 
                        onClick={() => handleMenuClick('/account-settings')} 
                    />
                </nav>

                <div className="mt-auto px-6 pb-6">
                    <button 
                        onClick={() => { localStorage.clear(); navigate('/'); }}
                        className="text-[10px] uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors w-full text-left"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Navbar */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-12 sticky top-0 z-10">
                    <img src={logoBlack} className="h-10 object-contain" alt="Vivre Logo" />
                    <button className="text-gray-400 hover:text-[#d4af37] transition">
                        <NotificationBell />
                    </button>
                </header>

                {/* Content Outlet */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

// The Flashy Button Component
const SidebarButton = ({ label, active, onClick }) => (
    <button 
        onClick={onClick} 
        className={`w-full text-left px-8 py-4 text-[10px] uppercase tracking-[0.2em] transition-all duration-300 border-l-4 
            ${active 
                ? 'border-[#d4af37] bg-[#5c5c5c] text-[#d4af37] font-bold' 
                : 'border-transparent text-gray-300 hover:bg-[#5c5c5c] hover:text-[#d4af37]'
            }`}
    >
        {label}
    </button>
);

export default PatientLayout;