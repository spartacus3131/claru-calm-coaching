/**
 * Projects Module Tests - F014
 * 
 * Per 001-tdd.mdc: Write tests FIRST before implementation
 */

import {
  CreateProjectSchema,
  UpdateProjectSchema,
  toProject,
  toDbInsert,
  toDbUpdate,
  type Project,
} from './projects';

describe('Projects Module', () => {
  describe('CreateProjectSchema', () => {
    it('validates valid project input', () => {
      const input = {
        name: 'Q1 Product Launch',
        description: 'Launch the new product by end of Q1',
      };

      const result = CreateProjectSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Q1 Product Launch');
        expect(result.data.status).toBe('active'); // default
      }
    });

    it('requires name', () => {
      const input = {
        description: 'Some description',
      };

      const result = CreateProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const input = {
        name: '',
      };

      const result = CreateProjectSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('accepts all valid statuses', () => {
      const statuses = ['active', 'parked', 'completed'];

      for (const status of statuses) {
        const result = CreateProjectSchema.safeParse({
          name: 'Test Project',
          status,
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid status', () => {
      const result = CreateProjectSchema.safeParse({
        name: 'Test Project',
        status: 'blocked', // Not in spec
      });
      expect(result.success).toBe(false);
    });

    it('accepts hotspotId for future use', () => {
      const result = CreateProjectSchema.safeParse({
        name: 'Fitness Goals',
        hotspotId: 'body',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('UpdateProjectSchema', () => {
    it('allows partial updates', () => {
      const result = UpdateProjectSchema.safeParse({
        status: 'completed',
      });
      expect(result.success).toBe(true);
    });

    it('allows nullable fields', () => {
      const result = UpdateProjectSchema.safeParse({
        description: null,
        notes: null,
      });
      expect(result.success).toBe(true);
    });

    it('validates name if provided', () => {
      const result = UpdateProjectSchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('toProject', () => {
    it('converts database row to Project entity', () => {
      const row = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '987fcdeb-51a2-3b4c-5d6e-7f8a9b0c1d2e',
        name: 'Q1 Launch',
        description: 'Launch product',
        notes: 'Some notes',
        hotspot_id: 'career',
        status: 'active',
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      };

      const project = toProject(row);

      expect(project.id).toBe(row.id);
      expect(project.userId).toBe(row.user_id);
      expect(project.name).toBe(row.name);
      expect(project.description).toBe(row.description);
      expect(project.notes).toBe(row.notes);
      expect(project.hotspotId).toBe(row.hotspot_id);
      expect(project.status).toBe('active');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('handles null optional fields', () => {
      const row = {
        id: '123',
        user_id: '456',
        name: 'Test',
        description: null,
        notes: null,
        hotspot_id: null,
        status: 'parked',
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      };

      const project = toProject(row);

      expect(project.description).toBeNull();
      expect(project.notes).toBeNull();
      expect(project.hotspotId).toBeNull();
    });
  });

  describe('toDbInsert', () => {
    it('converts input to database format', () => {
      const input = {
        name: 'New Project',
        description: 'A description',
        status: 'active' as const,
      };
      const userId = 'user-123';

      const dbData = toDbInsert(input, userId);

      expect(dbData.user_id).toBe(userId);
      expect(dbData.name).toBe(input.name);
      expect(dbData.description).toBe(input.description);
      expect(dbData.status).toBe('active');
    });

    it('sets null for missing optional fields', () => {
      const input = {
        name: 'Minimal Project',
      };
      const userId = 'user-123';

      const dbData = toDbInsert(input, userId);

      expect(dbData.description).toBeNull();
      expect(dbData.notes).toBeNull();
      expect(dbData.hotspot_id).toBeNull();
    });
  });

  describe('toDbUpdate', () => {
    it('only includes provided fields', () => {
      const input = {
        status: 'completed' as const,
      };

      const dbData = toDbUpdate(input);

      expect(dbData).toEqual({ status: 'completed' });
      expect(dbData).not.toHaveProperty('name');
      expect(dbData).not.toHaveProperty('description');
    });

    it('includes null values when explicitly set', () => {
      const input = {
        description: null,
      };

      const dbData = toDbUpdate(input);

      expect(dbData).toEqual({ description: null });
    });

    it('converts hotspotId to hotspot_id', () => {
      const input = {
        hotspotId: 'career',
      };

      const dbData = toDbUpdate(input);

      expect(dbData).toEqual({ hotspot_id: 'career' });
    });
  });
});
