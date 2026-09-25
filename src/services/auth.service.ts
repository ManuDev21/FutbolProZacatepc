import { db } from '@/db/database';
import { nowISO, sha256, uuid } from '@/lib/utils';
import { session, setSessionUser } from '@/lib/session';
import type { Role, User } from '@/types';
import { auditService } from './audit.service';

const SESSION_KEY = 'fpz.session';

export interface SessionInfo {
  userId: string;
  username: string;
  displayName: string;
  role: Role;
}

export const authService = {
  /** Crea los usuarios por defecto si la tabla está vacía. */
  async ensureDefaultUsers(): Promise<void> {
    const count = await db.users.count();
    if (count > 0) return;
    const mk = async (
      username: string,
      password: string,
      displayName: string,
      role: Role,
    ): Promise<User> => ({
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      username,
      displayName,
      passwordHash: await sha256(password),
      role,
      active: true,
    });
    await db.users.bulkAdd([
      await mk('admin', 'admin123', 'Administrador', 'admin'),
      await mk('entrenador', 'coach123', 'Entrenador Demo', 'coach'),
      await mk('padre', 'padre123', 'Padre Demo', 'parent'),
    ]);
  },

  async login(username: string, password: string): Promise<User | null> {
    const user = await db.users.where('username').equals(username.trim().toLowerCase()).first();
    if (!user || !user.active) return null;
    const hash = await sha256(password);
    if (hash !== user.passwordHash) return null;
    const info: SessionInfo = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(info));
    setSessionUser(user);
    await auditService.log('iniciar-sesion', 'usuario', user.id);
    return user;
  },

  async restore(): Promise<User | null> {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const info = JSON.parse(raw) as SessionInfo;
      const user = await db.users.get(info.userId);
      if (!user || !user.active) return null;
      setSessionUser(user);
      return user;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    if (session.user) await auditService.log('cerrar-sesion', 'usuario', session.user.id);
    localStorage.removeItem(SESSION_KEY);
    setSessionUser(null);
  },

  async createUser(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'> & { password: string },
  ): Promise<User> {
    const user: User = {
      ...data,
      username: data.username.trim().toLowerCase(),
      passwordHash: await sha256(data.password),
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    delete (user as Partial<{ password: string }>).password;
    await db.users.add(user);
    await auditService.log('crear', 'usuario', user.id);
    return user;
  },

  async updateUser(id: string, patch: Partial<User> & { password?: string }): Promise<void> {
    const { password, ...rest } = patch;
    const update: Partial<User> = { ...rest, updatedAt: nowISO() };
    if (rest.username) update.username = rest.username.trim().toLowerCase();
    if (password) update.passwordHash = await sha256(password);
    await db.users.update(id, update);
    await auditService.log('actualizar', 'usuario', id);
  },

  async removeUser(id: string): Promise<void> {
    await db.users.delete(id);
    await auditService.log('eliminar', 'usuario', id);
  },

  list(): Promise<User[]> {
    return db.users.toArray();
  },
};
