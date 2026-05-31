import ResponsivePortalLayout from './ResponsivePortalLayout';
import { getStoredUser } from '../utils/session';
import { ADMIN_TASKS, getAdminPermissions } from '../utils/adminAccess';

const AdminLayout = () => {
    const user = getStoredUser();
    const permissions = getAdminPermissions(user);

    return (
        <ResponsivePortalLayout
            user={user}
            displayName={user?.first_name || 'Admin'}
            navItems={[
                ...ADMIN_TASKS.filter((task) => permissions.includes(task.key)).map(({ label, path }) => ({ label, path })),
                { label: 'My Profile', path: '/admin/profile' },
            ]}
        />
    );
};

export default AdminLayout;
