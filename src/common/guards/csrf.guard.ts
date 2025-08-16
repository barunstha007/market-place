import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual } from 'crypto';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private cfg: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();

    const cookieName = this.cfg.get('CSRF_COOKIE_NAME');
    const headerName = this.cfg.get('CSRF_HEADER_NAME');

    // Provision token if missing (first GET to /auth/refresh/csrf for example)
    if (req.method === 'GET') {
      const token = randomBytes(24).toString('hex');
      res.cookie(cookieName, token, {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
      });
      return true;
    }

    // Validate on POST /auth/refresh
    const cookie = req.cookies?.[cookieName];
    const header = req.headers?.[headerName] as string;
    if (!cookie || !header) throw new ForbiddenException('Missing CSRF token');

    // timing safe compare
    const a = Buffer.from(cookie);
    const b = Buffer.from(header);
    const ok = a.length === b.length && timingSafeEqual(a, b);
    if (!ok) throw new ForbiddenException('Invalid CSRF token');
    return true;
  }
}
