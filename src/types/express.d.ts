export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  className?: string | null;
  roleId: string;
  roleName: 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER';
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
