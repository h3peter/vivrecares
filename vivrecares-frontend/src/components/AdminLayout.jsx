import ResponsivePortalLayout from './ResponsivePortalLayout';
import { getStoredUser } from '../utils/session';

const AdminLayout = () => {
    const user = getStoredUser();

    return (
        <ResponsivePortalLayout
            user={user}
            displayName={user?.first_name || 'Admin'}
            navItems={[
                { label: 'Manage Patients', path: '/admin/patients' },
                { label: 'Appointment Logs', path: '/admin/appointments' },
                { label: 'Billing & Payments', path: '/admin/billing' },
                { label: 'Reports', path: '/admin/reports' },
                { label: 'Settings', path: '/admin/settings' },
                { label: 'My Profile', path: '/admin/profile' },
            ]}
        />
    );
};

export default AdminLayout;
