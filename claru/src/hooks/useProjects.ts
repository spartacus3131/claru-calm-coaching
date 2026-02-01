'use client';

/**
 * @file useProjects.ts
 * @description Hook for managing user projects
 * @module hooks
 * 
 * F014: Projects CRUD
 * 
 * Per 006-port-ui.mdc: Ported from old repo, adapted for Next.js
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/modules/context-store/projects';

interface UseProjectsReturn {
  projects: Project[];
  activeProjects: Project[];
  recurringProjects: Project[];
  completedProjects: Project[];
  loading: boolean;
  error: string | null;
  addProject: (input: CreateProjectInput) => Promise<Project | null>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
}

/**
 * Hook for managing user projects with optimistic updates.
 * 
 * @returns Projects state and CRUD operations
 * 
 * @example
 * const { projects, addProject, loading } = useProjects();
 * await addProject({ name: 'Q1 Launch' });
 */
export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setError(null);
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          if (response.status === 401) {
            setProjects([]);
            setLoading(false);
            return;
          }
          throw new Error('Failed to load projects');
        }

        const { data } = await response.json();
        setProjects(data.map((p: Project) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })));
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  /**
   * Creates a new project with optimistic update.
   */
  const addProject = useCallback(async (input: CreateProjectInput): Promise<Project | null> => {
    // Optimistic update
    const tempId = crypto.randomUUID();
    const now = new Date();
    const tempProject: Project = {
      id: tempId,
      userId: '',
      title: input.title,
      type: input.type ?? 'active',
      status: input.status ?? 'active',
      goals: input.goals ?? [],
      blockers: input.blockers ?? [],
      nextActions: input.nextActions ?? [],
      recentProgress: input.recentProgress ?? null,
      notes: input.notes ?? null,
      position: 0,
      createdAt: now,
      updatedAt: now,
    };

    setProjects((prev) => [tempProject, ...prev]);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const { data } = await response.json();
      const createdProject: Project = {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };

      // Replace temp with real project
      setProjects((prev) =>
        prev.map((p) => (p.id === tempId ? createdProject : p))
      );

      return createdProject;
    } catch (err) {
      // Rollback on failure
      setProjects((prev) => prev.filter((p) => p.id !== tempId));
      
      const message = err instanceof Error ? err.message : 'Failed to create project';
      toast.error(message);
      return null;
    }
  }, []);

  /**
   * Updates an existing project with optimistic update.
   */
  const updateProject = useCallback(async (
    id: string,
    input: UpdateProjectInput
  ): Promise<boolean> => {
    const original = projects.find((p) => p.id === id);
    if (!original) return false;

    // Optimistic update
    const updated: Project = {
      ...original,
      ...input,
      updatedAt: new Date(),
    };
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? updated : p))
    );

    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update project');
      }

      return true;
    } catch (err) {
      // Rollback on failure
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? original : p))
      );

      const message = err instanceof Error ? err.message : 'Failed to update project';
      toast.error(message);
      return false;
    }
  }, [projects]);

  /**
   * Deletes a project with optimistic update.
   */
  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    const original = projects.find((p) => p.id === id);
    if (!original) return false;

    // Optimistic update
    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      return true;
    } catch (err) {
      // Rollback on failure
      setProjects((prev) => [...prev, original]);
      toast.error('Failed to delete project');
      return false;
    }
  }, [projects]);

  // Filtered views by type and status
  const activeProjects = useMemo(
    () => projects.filter((p) => p.type === 'active' && p.status !== 'completed'),
    [projects]
  );

  const recurringProjects = useMemo(
    () => projects.filter((p) => p.type === 'recurring' && p.status !== 'completed'),
    [projects]
  );

  const completedProjects = useMemo(
    () => projects.filter((p) => p.status === 'completed'),
    [projects]
  );

  return {
    projects,
    activeProjects,
    recurringProjects,
    completedProjects,
    loading,
    error,
    addProject,
    updateProject,
    deleteProject,
  };
}
