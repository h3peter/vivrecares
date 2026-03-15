import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import logoBlack from '../assets/vivre-black.png';
import ProfileAvatar from './ProfileAvatar'; 

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));

    // Admin display name
    const displayName = user?.first_name || "Admin";

    return (
        <div className="flex min-h-screen bg-[#faf9f6] font-sans">
            {/* Fixed Admin Sidebar */}
            <aside className="w-64 bg-[#4d4d4d] text-white flex flex-col py-12 sticky top-0 h-screen">
                <div className="flex flex-col items-center px-6 mb-12">
                    <div className="w-24 h-24 mx-auto rounded-full border-2 border-[#d4af37] overflow-hidden mb-4 bg-gray-200">
                        <ProfileAvatar 
                            user={user} 
                            className="w-full h-full" 
                            textSize="text-4xl" 
                        />
                    </div>
                    <h3 className="text-sm font-light tracking-widest text-center uppercase">
                        Good day, <br/> 
                        <span className="font-bold text-lg">{displayName}!</span>
                    </h3>
                </div>

                <nav className="w-full flex flex-col space-y-1">
                    <SidebarButton 
                        label="Manage Patients" 
                        active={location.pathname === '/admin/patients'} 
                        onClick={() => navigate('/admin/patients')} 
                    />
                    <SidebarButton 
                        label="Appointment Logs" 
                        active={location.pathname === '/admin/appointments'} 
                        onClick={() => navigate('/admin/appointments')} 
                    />
                    <SidebarButton 
                        label="Billing & Payments" 
                        active={location.pathname === '/admin/billing'} 
                        onClick={() => navigate('/admin/billing')} 
                    />
                    <SidebarButton 
                        label="My Profile" 
                        active={location.pathname === '/admin/profile'} 
                        onClick={() => navigate('/admin/profile')} 
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
                    <div className="flex items-center gap-6">
                         <button className="text-gray-400 hover:text-[#d4af37] transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </button>
                        <div className="w-10 h-10 rounded-full bg-[#2d2a26] flex items-center justify-center text-[#d4af37]">
                            <span className="text-xs font-bold uppercase">{displayName.charAt(0)}</span>
                        </div>
                    </div>
                </header>

                {/* Content Outlet */}
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