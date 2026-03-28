import ResponsivePortalLayout from './ResponsivePortalLayout';
import { getStoredUser } from '../utils/session';

const PatientLayout = () => {
    const user = getStoredUser();
    const displayName = user?.nickname || user?.first_name || user?.name || 'Patient';

    return (
        <ResponsivePortalLayout
            user={user}
            displayName={displayName}
            navItems={[
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Patient Profile', path: '/profile' },
                { label: 'Request Appointment', path: '/request-appointment' },
                { label: 'Appointment History', path: '/appointment-history' },
                { label: 'Billing History', path: '/billing-history' },
                { label: 'Account Settings', path: '/account-settings' },
            ]}
        />
    );
};

export default PatientLayout;
