export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser | null;
      id?: string;
    }
  }
}

