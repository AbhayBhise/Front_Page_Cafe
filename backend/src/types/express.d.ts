import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface AuthContext {
      id: string;
      email: string;
      role: Role;
      guest?: boolean;
      cafeId?: string;
      tableId?: string;
    }
    interface CafeContext {
      id: string;
      role: 'owner' | 'counter';
      counterId?: string | null;
    }
    interface Request {
      auth?: AuthContext;
      cafeContext?: CafeContext;
    }
  }
}

export {};
