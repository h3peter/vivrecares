export const ADMIN_TASKS = [
    { key: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
    { key: 'patients', label: 'Manage Patients', path: '/admin/patients' },
    { key: 'appointments', label: 'Appointment Logs', path: '/admin/appointments' },
    { key: 'billing', label: 'Billing & Payments', path: '/admin/billing' },
    { key: 'reports', label: 'Reports', path: '/admin/reports' },
    { key: 'imports', label: 'Import', path: '/admin/imports' },
    { key: 'settings', label: 'Settings', path: '/admin/settings' },
];

export const DEFAULT_ADMIN_PERMISSIONS = ADMIN_TASKS.map((task) => task.key);

export const getAdminPermissions = (user) => {
    if (user?.is_super_admin) return DEFAULT_ADMIN_PERMISSIONS;
    if (Array.isArray(user?.admin_permissions) && user.admin_permissions.length > 0) {
        return user.admin_permissions;
    }
    return DEFAULT_ADMIN_PERMISSIONS;
};

export const canAccessAdminTask = (user, taskKey) => {
    if (user?.role !== 'Admin') return false;
    return getAdminPermissions(user).includes(taskKey);
};

export const firstAdminPath = (user) => {
    const permissions = getAdminPermissions(user);
    return ADMIN_TASKS.find((task) => permissions.includes(task.key))?.path || '/admin/profile';
};
