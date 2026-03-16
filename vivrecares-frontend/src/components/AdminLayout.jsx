import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import logoBlack from '../assets/vivre-black.png';
import ProfileAvatar from './ProfileAvatar'; 
import NotificationBell from './NotificationBell';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    const displayName = user?.first_name || "Admin";

    const handleMenuClick = (path) => {
        if (location.pathname !== path) navigate(path);
    };

    return (
        <div className="flex min-h-screen bg-[#faf9f6] font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-[#4d4d4d] text-white flex flex-col py-12 sticky top-0 h-screen">
                
                {/* Avatar + Greeting */}
                <div className="flex flex-col items-center px-6 mb-12">
                    <div className="w-24 h-24 mx-auto rounded-full border-2 border-[#d4af37] overflow-hidden mb-4 bg-gray-200">
                        <ProfileAvatar user={user} className="w-full h-full" textSize="text-4xl" />
                    </div>
                    <h3 className="text-sm font-light tracking-widest text-center uppercase">
                        Good day, <br/>
                        <span className="font-bold text-lg">{displayName}!</span>
                    </h3>
                </div>

                {/* Nav */}
                <nav className="w-full flex flex-col space-y-1">
                    <SidebarButton label="Manage Patients"   active={location.pathname === '/admin/patients'}     onClick={() => handleMenuClick('/admin/patients')} />
                    <SidebarButton label="Appointment Logs"  active={location.pathname === '/admin/appointments'} onClick={() => handleMenuClick('/admin/appointments')} />
                    <SidebarButton label="Billing & Payments" active={location.pathname === '/admin/billing'}     onClick={() => handleMenuClick('/admin/billing')} />
                    <SidebarButton label="My Profile"        active={location.pathname === '/admin/profile'}      onClick={() => handleMenuClick('/admin/profile')} />
                </nav>

                {/* Bottom actions */}
                <div className="mt-auto px-5 pb-8 flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[#5c5c5c] hover:bg-[#686868] text-gray-200 hover:text-white transition-all duration-200 group"
                    >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-[#d4af37] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-[11px] uppercase tracking-widest font-semibold">Home</span>
                    </button>

                    <button
                        onClick={() => { localStorage.clear(); navigate('/'); }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[#5c5c5c] hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-all duration-200 group"
                    >
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-[11px] uppercase tracking-widest font-semibold">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Navbar — logo is clickable, takes you to landing page */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-12 sticky top-0 z-10">
                    <img
                        src={logoBlack}
                        className="h-10 object-contain cursor-pointer hover:opacity-70 transition-opacity"
                        alt="Vivre Logo"
                        onClick={() => navigate('/')}
                        title="Back to Home"
                    />
                    <div className="flex items-center gap-6">
                        <NotificationBell />
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

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

export default AdminLayout;