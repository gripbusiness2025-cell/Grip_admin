// Get current user from sessionStorage
export const getCurrentUser = () => {
    const userData = sessionStorage.getItem('userDetails');
    return userData ? JSON.parse(userData) : null;
  };
  
  // Check specific permission
 export const hasPermission = (permissionKey) => {
    const user = getCurrentUser();
    
    // Zone admin specific permissions
    if (user?.data?.role === 'zone-admin') {
      if (permissionKey.startsWith("admin-users") || permissionKey.startsWith("panel-associate") || permissionKey.startsWith("onboarding-form")) {
        const permissions = user?.data?.role?.permissions;
        if (permissions && Array.isArray(permissions)) {
          return permissions.some(p => p.key === permissionKey);
        }
        return false;
      }
      const allowedForZoneAdmin = [
        "dashboard-list",
        "users-list", "users-create", "users-update",   // Needed to show and manage Admin Users
        "roles-list", "roles-create", "roles-update", "roles-delete",    // Needed to show Role menu and manage roles
        "chapters-list", "chapters-create", "chapters-update", // Needed to show Chapters under this menu and manage them
        "performers-list",
        "payments-list", "payments-create",
        // New permissions added
        "meeting-list", "meeting-create", "meeting-update", "meeting-delete",
        "events-list", "events-create", "events-update", "events-delete",
        "training-list", "training-create", "training-update", "training-delete",
        "121s-list", "121s-create", "121s-update", "121s-delete",
        "referrals-list", "referrals-create", "referrals-update", "referrals-delete",
        "thank-you-slip-list", "thank-you-slip-create", "thank-you-slip-update", "thank-you-slip-delete",
        "testimonial-list", "testimonial-create", "testimonial-update", "testimonial-delete",
        "visitor-guest-list", "visitor-guest-create", "visitor-guest-update", "visitor-guest-delete",
        "expected-visitors-list", "expected-visitors-create", "expected-visitors-update", "expected-visitors-delete",
        "associates-list", "associates-create", "associates-update", "associates-delete",
        "website-list", "website-create", "website-update", "website-delete",
      ];
      return allowedForZoneAdmin.includes(permissionKey);
    }

    // Detect role name regardless of whether role is an object or a plain string
    // (Same pattern used in DashBoardLayer.jsx and AnalyticsFilterModal.jsx)
    const rawRole = user?.data?.role;
    const roleName = (typeof rawRole === 'object' ? rawRole?.name : rawRole) || '';
    const roleNameLower = roleName.toLowerCase();

    // Super Admin / Admin → full access to everything, always
    const isSuperAdmin = roleNameLower === 'admin'
                      || roleNameLower === 'super admin'
                      || roleNameLower === 'super-admin';
    if (isSuperAdmin) return true;

    // ED → access for Executive Director
    const isED = roleNameLower === 'ed' || roleNameLower === 'executive director';
    if (isED) {
      if (permissionKey.startsWith("admin-users") || permissionKey.startsWith("panel-associate") || permissionKey.startsWith("onboarding-form")) {
        const permissions = user?.data?.role?.permissions;
        if (permissions && Array.isArray(permissions)) {
          return permissions.some(p => p.key === permissionKey);
        }
        return false;
      }

      // First check if role has explicit permissions assigned in DB
      const permissions = user?.data?.role?.permissions;
      if (permissions && Array.isArray(permissions)) {
        if (permissions.some(p => p.key === permissionKey)) return true;
      }

      const allowedForED = [
        "dashboard-list", "users-list", "users-update", "users-delete", "roles-list",
        "chapters-list", "chapters-create", "chapters-update", "performers-list",
        "payments-list", "payments-create", "payments-update", "payments-delete",
        "meeting-list", "meeting-create", "meeting-update", "meeting-delete",
        "events-list", "events-create", "events-update", "events-delete",
        "training-list", "training-create", "training-update", "training-delete",
        "121s-list", "121s-create", "121s-update", "121s-delete",
        "referrals-list", "referrals-create", "referrals-update", "referrals-delete",
        "thank-you-slip-list", "thank-you-slip-create", "thank-you-slip-update", "thank-you-slip-delete",
        "testimonial-list", "testimonial-create", "testimonial-update", "testimonial-delete",
        "visitor-guest-list", "visitor-guest-create", "visitor-guest-update", "visitor-guest-delete",
        "expected-visitors-list", "expected-visitors-create", "expected-visitors-update", "expected-visitors-delete",
        "visitor-feedback-list", "visitor-feedback-create", "visitor-feedback-update", "visitor-feedback-delete",
        "associates-list", "associates-create", "associates-update", "associates-delete",
        "website-list", "website-create", "website-update", "website-delete",
      ];
      return allowedForED.includes(permissionKey);
    }

    // Chapter-level roles (RD, Mentor, etc.) — users who have chapterId in their session
    // NOTE: only use chapterId presence to detect chapter-level users, NOT role.name,
    // to avoid falsely matching Admin role objects that haven't been populated yet.
    const sessionUser = user?.data;
    const userChapters = sessionUser?.chapterId || sessionUser?.chapterIds;
    const isChapterLevelUser = userChapters && (Array.isArray(userChapters) ? userChapters.length > 0 : true);
    
    // Check role's specific permissions in DB
    const permissions = user?.data?.role?.permissions;
    if (permissions && Array.isArray(permissions)) {
      if (permissions.some(p => p.key === permissionKey)) return true;
    }

    if (isChapterLevelUser) {
      const allowedForChapterUser = [
        "dashboard-list",
      ];
      // Check if the permission is in the default chapter-user list
      if (allowedForChapterUser.includes(permissionKey)) return true;
    }

    return false;
  }; 

export const hasDeletePermission = (permissionKey) => {
  const user = getCurrentUser();

  const rawRole = user?.data?.role;
  const roleName = (typeof rawRole === 'object' ? rawRole?.name : rawRole) || '';
  const roleNameLower = roleName.toLowerCase();
  const isSuperAdmin = roleNameLower === 'admin'
                    || roleNameLower === 'super admin'
                    || roleNameLower === 'super-admin';
  if (isSuperAdmin) return true;

  if (user?.data?.role === 'zone-admin') {
    return false; // Or true depending on if they can delete. Let's return false by default for now unless specified.
  }

  const isED = roleNameLower === 'ed' || roleNameLower === 'executive director';
  if (isED) {
    return hasPermission(permissionKey);
  }

  const permissions = user?.data?.role?.permissions;
  if (!permissions || !Array.isArray(permissions)) return false;

  if (permissionKey.includes('-')) {
    return permissions.some(p => p.key === permissionKey);
  }

  return permissions.some((p) => {
    const keyPart = p.key?.split('-').pop()?.toLowerCase(); // get last part after "-"
    return keyPart === permissionKey.toLowerCase();
  });
};

  
  // Save user data to sessionStorage
  export const setCurrentUser = (userData) => {
    sessionStorage.setItem('userDetails', JSON.stringify(userData));
  };
  
  // Clear session
  export const clearSession = () => {
    sessionStorage.removeItem('userDetails');
  };