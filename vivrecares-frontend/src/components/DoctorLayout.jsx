import ResponsivePortalLayout from './ResponsivePortalLayout';
import { getStoredUser } from '../utils/session';

const DoctorLayout = () => {
    const user = getStoredUser();

    return (
        <ResponsivePortalLayout
            user={user}
            displayName={user?.first_name || 'Doctor'}
            navItems={[
                { label: 'Patients', path: '/doctor/patients' },
                { label: 'Appointments', path: '/doctor/appointments' },
                { label: 'Availability', path: '/doctor/availability' },
                { label: 'Clinical Reports', path: '/doctor/reports' },
                { label: 'My Profile', path: '/doctor/profile' },
            ]}
        />
    );
};

export default DoctorLayout;
