import type { EntityTable, Table, UpdateSpec } from 'dexie';
import { nowISO, uuid } from '@/lib/utils';
import type { BaseEntity } from '@/types';
import { auditService } from './audit.service';

/**
 * Fábrica de servicios CRUD con timestamps automáticos y auditoría.
 * Punto de extensión: para migrar a backend, reemplazar esta fábrica
 * por una implementación HTTP manteniendo las mismas firmas.
 */
export function createCrudService<T extends BaseEntity>(table: EntityTable<T, 'id'>, entityLabel: string) {
  const t = table as unknown as Table<T, string>;
  return {
    table: t,

    async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
      const entity = { ...data, id: uuid(), createdAt: nowISO(), updatedAt: nowISO() } as T;
      await t.add(entity);
      await auditService.log('crear', entityLabel, entity.id);
      return entity;
    },

    async bulkCreate(items: Omit<T, keyof BaseEntity>[]): Promise<T[]> {
      const stamped = items.map((i) => ({ ...i, id: uuid(), createdAt: nowISO(), updatedAt: nowISO() }) as T);
      await t.bulkAdd(stamped);
      await auditService.log('crear-masivo', entityLabel, undefined, `${stamped.length} registros`);
      return stamped;
    },

    getById(id: string): Promise<T | undefined> {
      return t.get(id);
    },

    getAll(): Promise<T[]> {
      return t.toArray();
    },

    async update(id: string, patch: Partial<Omit<T, keyof BaseEntity>>): Promise<T | undefined> {
      const updated = await t.update(id, { ...patch, updatedAt: nowISO() } as UpdateSpec<T>);
      if (!updated) return undefined;
      await auditService.log('actualizar', entityLabel, id);
      return t.get(id);
    },

    async remove(id: string): Promise<void> {
      await t.delete(id);
      await auditService.log('eliminar', entityLabel, id);
    },

    count(): Promise<number> {
      return t.count();
    },
  };
}
