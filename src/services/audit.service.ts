import { db } from '@/db/database';
import { nowISO, uuid } from '@/lib/utils';
import { session } from '@/lib/session';
import type { AuditLog } from '@/types';

export const auditService = {
  async log(action: string, entity: string, entityId?: string, detail?: string) {
    try {
      const entry: AuditLog = {
        id: uuid(),
        createdAt: nowISO(),
        updatedAt: nowISO(),
        userId: session.user?.id,
        userName: session.user?.displayName ?? 'sistema',
        action,
        entity,
        entityId,
        detail,
      };
      await db.audit_logs.add(entry);
    } catch {
      // La auditoría nunca debe romper la operación principal.
    }
  },

  list(limit = 300) {
    return db.audit_logs
      .toArray()
      .then((a) => a.sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, limit));
  },
};
