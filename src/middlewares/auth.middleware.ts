import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { User, Role, Permission } from '../database/models';
import { AuthenticatedUser } from '../types/express';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export async function authenticateJwt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ACCESS_SECRET || 'avazas_super_secure_access_jwt_secret_token_key_2026_xyz';

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, secret) as JwtPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token has expired', 'TOKEN_EXPIRED');
      }
      throw new UnauthorizedError('Invalid access token', 'TOKEN_INVALID');
    }

    // Load user and associated role with permissions
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Role,
          as: 'role',
          include: [
            {
              model: Permission,
              as: 'permissions',
              attributes: ['name'],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!user) {
      throw new UnauthorizedError('User account not found', 'USER_NOT_FOUND');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError(
        `Your account is currently ${user.status.toLowerCase()}. Please contact support.`,
        'ACCOUNT_INACTIVE'
      );
    }

    const role = (user as any).role;
    const permissions: string[] = role?.permissions?.map((p: any) => p.name) || [];

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      className: user.className ?? null,
      roleId: user.roleId,
      roleName: role?.name as 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER',
      permissions,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuthenticateJwt(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ACCESS_SECRET || 'avazas_super_secure_access_jwt_secret_token_key_2026_xyz';

    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      const user = await User.findByPk(decoded.userId, {
        include: [{ model: Role, as: 'role' }],
      });
      if (user && user.status === 'ACTIVE') {
        const role = (user as any).role;
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          className: user.className ?? null,
          roleId: user.roleId,
          roleName: role?.name as 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER',
          permissions: [],
        };
      }
    } catch {
      // Ignore token decode failures for optional auth
    }
    next();
  } catch (error) {
    next();
  }
}
