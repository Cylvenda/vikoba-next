const apiRootFromEnv = process.env.NEXT_PUBLIC_API_BASE || "/api/proxy/"
const normalizedApiRoot = apiRootFromEnv.endsWith("/") ? apiRootFromEnv : `${apiRootFromEnv}/`

export const API_ENDPOINTS = {
     // root api endpoint
     API_ROOT: normalizedApiRoot,

     // User Authentication Endpoints
     USER_REGISTRATION: "auth/users/",
     USER_LOGIN: "me/auth/login/",
     USER_TOKEN_REFRESH: "me/auth/refresh/",
     USER_TOKEN_VERIFY: "me/auth/verify/",
     USER_LOGOUT: "me/auth/logout/",

     // User activation and password management
     USER_ACCOUNT_ACTIVATION: "auth/users/activation/",
     USER_RESEND_ACTIVATION_EMAIL: "auth/users/resend_activation/",
     USER_PASSWORD_RESET: "auth/users/reset_password/",
     USER_PASSWORD_RESET_CONFIRM: "auth/users/reset_password_confirm/",

     // Current user
     CURRENT_USER_PROFILE: "me/auth/me/",

     // Groups
     USER_GROUPS: "groups/", // get & post
     JOIN_GROUP_BY_CODE: "groups/join/", // post join code
     GET_GROUP: "groups/", // get group by id
     GET_GROUP_MEMBERS: "groups/", // ==> {uuid}/members/ To add group uuid to get members
     MY_GROUP_INVITATIONS: "groups/invitations/my/",
     GROUP_RESPOND_INVITATION: "groups/invitations/",

     // Meetings
     USER_MEETINGS: "meetings/",
     AGENDA_SECTIONS: "agenda-sections/",
     AGENDA_ITEMS: "agenda-items/",
     REALTIME: "realtime/",

     // Finance
     FINANCE_CONTRIBUTIONS: "finance/contributions/",
     FINANCE_LOAN_PRODUCTS: "finance/loan-categories/",
     FINANCE_LOANS: "finance/loans/request/",
     FINANCE_LOAN_INSTALLMENTS: "finance/loans/",
     FINANCE_LOAN_PAYMENTS: "finance/loans/",
     FINANCE_FINES: "finance/fines/",
     FINANCE_FINE_PAYMENTS: "finance/fines/payments/",
     FINANCE_FINE_CATEGORIES: "finance/fine-categories/",

     // Admin
     ADMIN_USERS: "admin/users/",
     ADMIN_GROUPS: "admin/groups/",
     ADMIN_RESPOND_JOIN_REQUEST: "groups/", // groups/{groupUuid}/join-requests/{invitationUuid}/respond/

     // Notifications
     NOTIFICATIONS: "notifications/",
}
