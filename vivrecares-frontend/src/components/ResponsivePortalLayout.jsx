import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoBlack from '../assets/vivre-black.png';
import NotificationBell from './NotificationBell';
import ProfileAvatar from './ProfileAvatar';
import { clearStoredSession } from '../utils/session';

const ResponsivePortalLayout = ({ user, displayName, navItems, homePath = '/' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    useEffect(() => {
        setIsMobileNavOpen(false);
        setIsNotificationsOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isMobileNavOpen) return undefined;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isMobileNavOpen]);

    const handleMenuClick = (path) => {
        if (location.pathname !== path) {
            navigate(path);
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('/logout.php');
        } catch (error) {
        } finally {
            clearStoredSession();
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-[#faf9f6] font-sans lg:flex">
            {isMobileNavOpen && (
                <button
                    type="button"
                    aria-label="Close navigation"
                    className="fixed inset-0 z-30 bg-black/45 lg:hidden"
                    onClick={() => setIsMobileNavOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-[18rem] max-w-[88vw] flex-col bg-[#4d4d4d] text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 lg:shadow-none ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between px-5 pt-5 lg:hidden">
                    <img
                        src={logoBlack}
                        className="h-8 object-contain brightness-[4.2] contrast-0"
                        alt="Vivre Logo"
                    />
                    <button
                        type="button"
                        onClick={() => setIsMobileNavOpen(false)}
                        className="rounded-full border border-white/15 p-2 text-gray-200 transition hover:bg-white/10"
                        aria-label="Close menu"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col items-center px-6 pb-8 pt-8 lg:py-12">
                    <div className="mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-[#d4af37] bg-gray-200 lg:h-24 lg:w-24">
                        <ProfileAvatar user={user} className="h-full w-full" textSize="text-3xl lg:text-4xl" />
                    </div>
                    <h3 className="text-center text-xs font-light uppercase tracking-[0.26em] text-gray-200 lg:text-sm">
                        Good day,
                        <br />
                        <span className="mt-2 inline-block text-base font-bold tracking-[0.12em] text-white lg:text-lg">
                            {displayName}!
                        </span>
                    </h3>
                </div>

                <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-6">
                    {navItems.map((item) => (
                        <SidebarButton
                            key={item.path}
                            label={item.label}
                            active={location.pathname === item.path}
                            onClick={() => handleMenuClick(item.path)}
                        />
                    ))}
                </nav>

                <div className="px-4 pb-5 pt-3 lg:px-5 lg:pb-8">
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate(homePath)}
                            className="flex w-full items-center gap-3 rounded-xl bg-[#5c5c5c] px-4 py-3.5 text-gray-100 transition-all duration-200 hover:bg-[#686868] hover:text-white"
                        >
                            <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0 7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6" />
                            </svg>
                            <span className="text-sm font-bold uppercase tracking-[0.12em]">Home</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-xl bg-[#5c5c5c] px-4 py-3.5 text-red-300 transition-all duration-200 hover:bg-red-900/40 hover:text-red-200"
                        >
                            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
                            </svg>
                            <span className="text-sm font-bold uppercase tracking-[0.12em]">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur">
                    <div className="flex min-h-20 items-center justify-between gap-3 px-4 sm:px-6 lg:px-12">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsNotificationsOpen(false);
                                    setIsMobileNavOpen(true);
                                }}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 transition hover:border-[#d4af37] hover:text-[#8f8167] lg:hidden"
                                aria-label="Open menu"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 7h16M4 12h16M4 17h16" />
                                </svg>
                            </button>

                            <img
                                src={logoBlack}
                                className="h-8 cursor-pointer object-contain transition-opacity hover:opacity-70 sm:h-9 lg:h-10"
                                alt="Vivre Logo"
                                onClick={() => navigate(homePath)}
                                title="Back to Home"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden rounded-full border border-gray-200 bg-[#faf9f6] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8f8167] sm:block lg:hidden">
                                {displayName}
                            </div>
                            <NotificationBell
                                isOpen={isNotificationsOpen}
                                onOpenChange={setIsNotificationsOpen}
                                onOpen={() => setIsMobileNavOpen(false)}
                            />
                        </div>
                    </div>
                </header>

                <main className="min-w-0 flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const SidebarButton = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full rounded-xl border border-transparent px-5 py-3.5 text-left text-sm font-bold uppercase tracking-[0.12em] transition-all duration-300 ${active
            ? 'border-[#d4af37]/40 bg-[#626262] text-[#f1d17a] shadow-sm'
            : 'text-gray-100 hover:bg-[#5c5c5c] hover:text-[#f1d17a]'
            }`}
    >
        {label}
    </button>
);

export default ResponsivePortalLayout;
