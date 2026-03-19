/**
 * Tests for the entities localStorage CRUD module.
 *
 * Uses jsdom's localStorage implementation (provided by vitest/jsdom environment).
 * Covers: create, read, update, delete, filter, sort, limit, and error branches.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createEntity } from './entities';

describe('entities — CRUD operations', () => {
  const entity = createEntity('test_item');

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── create ─────────────────────────────────────────────────────────────

  it('creates a record with auto-generated id and timestamps', async () => {
    const record = await entity.create({ name: 'Alpha' });
    expect(record.id).toBeTruthy();
    expect(record.name).toBe('Alpha');
    expect(record.created_date).toBeTruthy();
    expect(record.updated_date).toBeTruthy();
  });

  it('persists records across separate accessor calls', async () => {
    await entity.create({ name: 'Persisted' });
    const records = await entity.list();
    expect(records.some((r) => r.name === 'Persisted')).toBe(true);
  });

  // ── get ────────────────────────────────────────────────────────────────

  it('gets a record by id', async () => {
    const created = await entity.create({ name: 'GetTest' });
    const fetched = await entity.get(created.id);
    expect(fetched.id).toBe(created.id);
    expect(fetched.name).toBe('GetTest');
  });

  it('throws when getting a non-existent id', async () => {
    await expect(entity.get('nonexistent-id')).rejects.toThrow('not found');
  });

  // ── update ─────────────────────────────────────────────────────────────

  it('updates an existing record', async () => {
    const created = await entity.create({ name: 'Before' });
    const updated = await entity.update(created.id, { name: 'After' });
    expect(updated.name).toBe('After');
    expect(updated.id).toBe(created.id);
  });

  it('throws when updating a non-existent id', async () => {
    await expect(entity.update('nonexistent-id', { name: 'X' })).rejects.toThrow('not found');
  });

  // ── delete ─────────────────────────────────────────────────────────────

  it('deletes a record by id', async () => {
    const created = await entity.create({ name: 'ToDelete' });
    await entity.delete(created.id);
    const records = await entity.list();
    expect(records.every((r) => r.id !== created.id)).toBe(true);
  });

  it('throws when deleting a non-existent id', async () => {
    await expect(entity.delete('nonexistent-id')).rejects.toThrow('not found');
  });

  // ── list ───────────────────────────────────────────────────────────────

  it('lists all records', async () => {
    await entity.create({ name: 'A' });
    await entity.create({ name: 'B' });
    const records = await entity.list();
    expect(records.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty array when no records exist', async () => {
    const records = await entity.list();
    expect(records).toEqual([]);
  });

  it('limits result count', async () => {
    await entity.create({ name: 'X1', score: 1 });
    await entity.create({ name: 'X2', score: 2 });
    await entity.create({ name: 'X3', score: 3 });
    const records = await entity.list(undefined, 2);
    expect(records).toHaveLength(2);
  });

  it('sorts ascending by field', async () => {
    const sortEntity = createEntity('sort_test_asc');
    await sortEntity.create({ name: 'Heavy', weight: 30 });
    await sortEntity.create({ name: 'Light', weight: 10 });
    await sortEntity.create({ name: 'Mid', weight: 20 });
    const records = await sortEntity.list('weight');
    const weights = records.map((r) => r.weight as number);
    expect(weights).toEqual([10, 20, 30]);
  });

  it('sorts descending by field with - prefix', async () => {
    const sortEntity = createEntity('sort_test_desc');
    await sortEntity.create({ name: 'Heavy', weight: 30 });
    await sortEntity.create({ name: 'Light', weight: 10 });
    await sortEntity.create({ name: 'Mid', weight: 20 });
    const records = await sortEntity.list('-weight');
    const weights = records.map((r) => r.weight as number);
    expect(weights).toEqual([30, 20, 10]);
  });

  // ── filter ─────────────────────────────────────────────────────────────

  it('filters by a specific field value', async () => {
    const filterEntity = createEntity('filter_test');
    await filterEntity.create({ name: 'Act1', status: 'active' });
    await filterEntity.create({ name: 'Inact1', status: 'inactive' });
    await filterEntity.create({ name: 'Act2', status: 'active' });
    const active = await filterEntity.filter({ status: 'active' });
    expect(active).toHaveLength(2);
    expect(active.every((r) => r.status === 'active')).toBe(true);
  });

  it('filter returns all records when query is empty', async () => {
    await entity.create({ name: 'FilterAll1' });
    await entity.create({ name: 'FilterAll2' });
    const records = await entity.filter();
    expect(records.length).toBeGreaterThanOrEqual(2);
  });

  it('filter applies sort and limit', async () => {
    const flEntity = createEntity('filter_limit');
    await flEntity.create({ cat: 'A', name: 'C', rank: 3 });
    await flEntity.create({ cat: 'A', name: 'A', rank: 1 });
    await flEntity.create({ cat: 'A', name: 'B', rank: 2 });
    const result = await flEntity.filter({ cat: 'A' }, 'rank', 2);
    expect(result).toHaveLength(2);
    expect(result[0]?.rank).toBe(1);
  });

  // ── localStorage corruption recovery ──────────────────────────────────

  it('returns empty array when localStorage contains corrupted JSON', async () => {
    localStorage.setItem('dccscan_entity_corrupt', 'NOT_VALID_JSON}}}');
    const corruptEntity = createEntity('corrupt');
    const records = await corruptEntity.list();
    expect(records).toEqual([]);
  });
});
