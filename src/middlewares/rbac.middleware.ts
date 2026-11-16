import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export function requireRole(...allowedRoles: Array<'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.roleName)) {
      return next(
        new ForbiddenError(
          `Insufficient role permissions. Required: [${allowedRoles.join(', ')}], Current: ${req.user.roleName}`,
          'INSUFFICIENT_ROLE'
        )
      );
    }

    next();
  };
}

export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // Super Admin inherently bypasses granular permission checks
    if (req.user.roleName === 'SUPER_ADMIN') {
      return next();
    }

    const hasAll = requiredPermissions.every((perm) =>
      req.user!.permissions.includes(perm)
    );

    if (!hasAll) {
      return next(
        new ForbiddenError(
          `Missing required permission: ${requiredPermissions.join(', ')}`,
          'INSUFFICIENT_PERMISSION'
        )
      );
    }

    next();
  };
}
