import { db } from '@/db/database';
import { nowISO, uuid } from '@/lib/utils';
import type { School, Setting } from '@/types';
import { auditService } from './audit.service';

async function getSetting<T>(key: string): Promise<T | undefined> {
  const row = await db.settings.where('key').equals(key).first();
  return row?.value as T | undefined;
}

async function setSetting(key: string, value: unknown): Promise<void> {
  const existing = await db.settings.where('key').equals(key).first();
  if (existing) {
    await db.settings.update(existing.id, { value, updatedAt: nowISO() });
  } else {
    await db.settings.add({ id: uuid(), key, value, createdAt: nowISO(), updatedAt: nowISO() } as Setting);
  }
}

export const settingsService = {
  getSetting,
  setSetting,

  getSchool(): Promise<School | undefined> {
    return db.schools.toCollection().first();
  },

  async saveSchool(patch: Partial<School>): Promise<School> {
    const existing = await db.schools.toCollection().first();
    if (existing) {
      await db.schools.update(existing.id, { ...patch, updatedAt: nowISO() });
      await auditService.log('actualizar', 'escuela', existing.id);
      return (await db.schools.get(existing.id))!;
    }
    const school: School = {
      id: uuid(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      name: 'FútbolPro Zacatepec',
      monthlyFee: 500,
      currency: 'MXN',
      primaryColor: '#177541',
      ...patch,
    };
    await db.schools.add(school);
    await auditService.log('crear', 'escuela', school.id);
    return school;
  },
};

export const SETTINGS_KEYS = {
  demoLoaded: 'demoLoaded',
  lastBackupAt: 'lastBackupAt',
  whatsappTemplate: 'whatsappTemplate',
  notifPrefs: 'notifPrefs',
} as const;
