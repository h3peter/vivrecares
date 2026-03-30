import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { clearStoredSession, getStoredUser } from '../utils/session';

const NotificationBell = ({ isOpen: controlledIsOpen, onOpenChange, onOpen, onClose }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef(null);
    const pollingStoppedRef = useRef(false);

    const user = getStoredUser();
    const isControlled = typeof controlledIsOpen === 'boolean';
    const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

    const setOpenState = (nextOpen) => {
        if (!isControlled) {
            setInternalIsOpen(nextOpen);
        }

        onOpenChange?.(nextOpen);

        if (nextOpen) {
            onOpen?.();
        } else {
            onClose?.();
        }
    };

    useEffect(() => {
        if (!user) return;

        pollingStoppedRef.current = false;

        const fetchNotifications = async () => {
            if (pollingStoppedRef.current) {
                return;
            }

            try {
                setIsLoading(true);
                const res = await axios.get(`/get_notifications.php?user_id=${user.id}`);
                if (res.data.status === 'success') {
                    setNotifications(res.data.data);
                    setUnreadCount(res.data.unread_count);
                }
            } catch (error) {
                if (error?.response?.status === 401) {
                    pollingStoppedRef.current = true;
                    setNotifications([]);
                    setUnreadCount(0);
                    setOpenState(false);
                    clearStoredSession();
                    return;
                }

                console.error("Notification error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!isOpen) return;
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenState(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    const resolveNotificationRoute = (notif) => {
        const title = String(notif?.title || '').toLowerCase();
        const message = String(notif?.message || '').toLowerCase();
        const role = String(user?.role || '');

        const isAppointment = title.includes('appointment') || message.includes('appointment');
        const isConsultation = title.includes('consultation') || message.includes('consultation');

        if (role === 'Admin') {
            if (isAppointment) return '/admin/appointments';
            return '/admin/patients';
        }

        if (role === 'Doctor') {
            if (isAppointment) return '/doctor/appointments';
            if (isConsultation) return '/doctor/patients';
            return '/doctor/appointments';
        }

        if (role === 'Patient') {
            if (isAppointment) return '/appointment-history';
            if (isConsultation) return '/profile';
            return '/profile';
        }

        return '/';
    };

    const handleNotificationClick = (notif) => {
        const targetRoute = notif?.redirect_url || resolveNotificationRoute(notif);
        setOpenState(false);
        navigate(targetRoute);
    };

    const handleOpenDropdown = async () => {
        const nextOpen = !isOpen;
        setOpenState(nextOpen);

        if (nextOpen && unreadCount > 0 && user?.id) {
            setUnreadCount(0);
            try {
                await axios.post('/mark_notifications_read.php', {
                    user_id: user.id
                });
            } catch (error) {
                console.error("Error clearing badge:", error);
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleOpenDropdown} className="relative p-2 text-gray-400 hover:text-[#d4af37] transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {unreadCount > 0 && (
                    <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed left-4 right-4 top-20 z-[70] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl animate-fadeIn sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-1rem)]">
                    <div className="bg-[#faf9f6] px-6 py-4 border-b border-gray-50">
                        <h4 className="text-[10px] uppercase tracking-widest text-[#b2a58d] font-bold">Notifications</h4>
                    </div>
                    <div className="max-h-[min(70vh,28rem)] overflow-y-auto custom-scrollbar p-2">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                                <div className="h-7 w-7 animate-spin rounded-full border-2 border-[#d4af37]/25 border-t-[#d4af37]" />
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">Loading</p>
                            </div>
                        ) : notifications.length > 0 ? notifications.map((notif) => (
                            <button
                                key={notif.notification_id}
                                type="button"
                                onClick={() => handleNotificationClick(notif)}
                                className={`w-full text-left p-4 rounded-xl mb-1 ${notif.is_read == 0 ? 'bg-blue-50/50' : 'hover:bg-gray-50'} transition`}
                            >
                                <p className="text-xs font-bold text-gray-800">{notif.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-2">
                                    {new Date(notif.created_at).toLocaleDateString()}
                                </p>
                            </button>
                        )) : (
                            <p className="text-xs text-gray-400 text-center py-6 italic">No new notifications.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
