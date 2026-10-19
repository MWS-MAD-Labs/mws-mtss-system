import { PERSON_TYPE } from '@/constants/enums';
import { PERMISSIONS } from '@/constants/permissions';

// What a person may open comes from the permissions Central gave them (user.permissions, from /auth/me).
// Nothing here reads a role.

export const hasPermission = (user, permission) => (
    Array.isArray(user?.permissions) && user.permissions.includes(permission)
);

export const hasAnyPermission = (user, permissions = []) => (
    permissions.some((permission) => hasPermission(user, permission))
);

export const isStudent = (user) => user?.personType === PERSON_TYPE.STUDENT;

// The emotional dashboard is its own permission in Central.
export const hasEmotionalDashboardAccess = (user) => hasPermission(user, PERMISSIONS.EMOTIONAL_DASHBOARD_READ);
