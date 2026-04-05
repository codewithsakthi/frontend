export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  STUDENT: 'student',
  FACULTY: 'faculty',
  HOD: 'hod',
  DIRECTOR: 'director',
};

// Maps user roles to their default home paths
export const ROLE_HOME_PATHS = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.STAFF]: '/staff',
  [ROLES.FACULTY]: '/staff',
  [ROLES.HOD]: '/staff',
  [ROLES.DIRECTOR]: '/staff',
  [ROLES.STUDENT]: '/dashboard',
};

// Returns the default path for a role, or fallback to login
export const getDefaultRouteForRole = (role) => {
  return ROLE_HOME_PATHS[role?.toLowerCase()] || '/login';
};
