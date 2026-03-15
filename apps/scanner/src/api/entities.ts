/**
 * Local entity storage using localStorage.
 * Provides CRUD operations for scanner data.
 *
 * Each entity type gets its own localStorage key: `dccscan_entity_{name}`
 */

import { type EntityAccessor, type EntityRecord } from '@/types';

function generateId(): string {
  return crypto.randomUUID();
}

function getEntityStore(entityName: string): EntityRecord[] {
  try {
    const raw = localStorage.getItem(`dccscan_entity_${entityName}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntityStore(entityName: string, records: EntityRecord[]): void {
  localStorage.setItem(`dccscan_entity_${entityName}`, JSON.stringify(records));
}

function matchesFilter(record: EntityRecord, filter: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (record[key] !== value) return false;
  }
  return true;
}

function sortRecords(records: EntityRecord[], sortStr?: string): EntityRecord[] {
  if (!sortStr) return records;
  const desc = sortStr.startsWith('-');
  const field = desc ? sortStr.slice(1) : sortStr;
  return [...records].sort((a, b) => {
    const aVal = a[field] as string | number;
    const bVal = b[field] as string | number;
    if (aVal < bVal) return desc ? 1 : -1;
    if (aVal > bVal) return desc ? -1 : 1;
    return 0;
  });
}

/**
 * Creates an entity accessor for a given entity name.
 */
export function createEntity(entityName: string): EntityAccessor {
  return {
    async create(data: Partial<EntityRecord>): Promise<EntityRecord> {
      const records = getEntityStore(entityName);
      const record = {
        ...data,
        created_date: new Date().toISOString(),
        id: generateId(),
        updated_date: new Date().toISOString(),
      } as EntityRecord;
      records.push(record);
      saveEntityStore(entityName, records);
      return record;
    },

    async delete(id: string): Promise<void> {
      const records = getEntityStore(entityName);
      const idx = records.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error(`${entityName} not found: ${id}`);
      records.splice(idx, 1);
      saveEntityStore(entityName, records);
    },

    async filter(
      query?: Record<string, unknown>,
      sort?: string,
      limit?: number,
    ): Promise<EntityRecord[]> {
      let records = getEntityStore(entityName);
      if (query) {
        records = records.filter((r) => matchesFilter(r, query));
      }
      if (sort) records = sortRecords(records, sort);
      if (limit) records = records.slice(0, limit);
      return records;
    },

    async get(id: string): Promise<EntityRecord> {
      const records = getEntityStore(entityName);
      const record = records.find((r) => r.id === id);
      if (!record) throw new Error(`${entityName} not found: ${id}`);
      return record;
    },
    async list(sort?: string, limit?: number): Promise<EntityRecord[]> {
      let records = getEntityStore(entityName);
      if (sort) records = sortRecords(records, sort);
      if (limit) records = records.slice(0, limit);
      return records;
    },

    async update(id: string, data: Partial<EntityRecord>): Promise<EntityRecord> {
      const records = getEntityStore(entityName);
      const idx = records.findIndex((r) => r.id === id);
      if (idx === -1) throw new Error(`${entityName} not found: ${id}`);
      const currentRecord = records[idx];
      if (!currentRecord) throw new Error(`${entityName} not found: ${id}`);
      records[idx] = {
        ...currentRecord,
        ...data,
        updated_date: new Date().toISOString(),
      } as EntityRecord;
      saveEntityStore(entityName, records);
      return records[idx] as EntityRecord;
    },
  };
}

// Pre-defined entity accessors for entities used in the app
export const AssetLogoRequest: EntityAccessor = createEntity('AssetLogoRequest');
export const NodeRegistration: EntityAccessor = createEntity('NodeRegistration');
