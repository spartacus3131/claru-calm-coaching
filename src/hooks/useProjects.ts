import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Project, ProjectType, ProjectStatus } from '@/types/claru';
import { backend } from '@/backend';
import type { CreateProjectInput, UpdateProjectInput } from '@/types/projects';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Load projects from database
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const loadProjects = async () => {
      try {
        const data = await backend.projects.list(user.id);
        setProjects(data);
      } catch (e) {
        console.error('Error loading projects:', e);
      }
      setLoading(false);
    };

    loadProjects();
  }, [user]);

  const addProject = useCallback(async (input: CreateProjectInput): Promise<Project | null> => {
    if (!user) {
      toast.error('Create an account to save projects', {
        action: {
          label: 'Sign up',
          onClick: () => window.location.href = '/auth'
        }
      });
      return null;
    }

    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newProject: Project = {
      id: tempId,
      user_id: user.id,
      title: input.title,
      type: input.type,
      status: input.status ?? 'active',
      goals: input.goals ?? [],
      blockers: input.blockers ?? [],
      next_actions: input.next_actions ?? [],
      recent_progress: input.recent_progress ?? null,
      notes: input.notes ?? null,
      position: 0,
      created_at: now,
      updated_at: now
    };

    setProjects(prev => [newProject, ...prev]);

    try {
      const created = await backend.projects.create(user.id, input);
      const createdProject: Project = {
        ...newProject,
        id: created.id,
        created_at: created.created_at,
        updated_at: created.updated_at,
        position: created.position,
      };
      setProjects((prev) => prev.map((p) => (p.id === tempId ? createdProject : p)));
      return createdProject;
    } catch (error: unknown) {
      console.error('Error adding project:', error);
      setProjects(prev => prev.filter(p => p.id !== tempId));
      const maybeCode = (error as { code?: string } | null)?.code;
      if (maybeCode === '23505') {
        toast.error('A project with this title already exists');
      } else {
        toast.error('Failed to add project');
      }
      return null;
    }
  }, [user]);

  const updateProject = useCallback(async (id: string, input: UpdateProjectInput): Promise<boolean> => {
    if (!user) return false;

    const project = projects.find(p => p.id === id);
    if (!project) return false;

    const updatedProject: Project = {
      ...project,
      ...input,
      updated_at: new Date().toISOString()
    };

    setProjects(prev =>
      prev.map(p => p.id === id ? updatedProject : p)
    );

    try {
      await backend.projects.update(user.id, id, input);
      return true;
    } catch (error: unknown) {
      console.error('Error updating project:', error);
      setProjects(prev =>
        prev.map(p => p.id === id ? project : p)
      );
      const maybeCode = (error as { code?: string } | null)?.code;
      if (maybeCode === '23505') {
        toast.error('A project with this title already exists');
      } else {
        toast.error('Failed to update project');
      }
      return false;
    }
  }, [user, projects]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    const project = projects.find(p => p.id === id);
    if (!project) return false;

    setProjects(prev => prev.filter(p => p.id !== id));

    try {
      await backend.projects.remove(user.id, id);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      setProjects(prev => [...prev, project]);
      toast.error('Failed to delete project');
      return false;
    }
  }, [user, projects]);

  // Filtered views
  const activeProjects = useMemo(() =>
    projects.filter(p => p.type === 'active' && p.status !== 'completed'),
    [projects]
  );

  const recurringProjects = useMemo(() =>
    projects.filter(p => p.type === 'recurring'),
    [projects]
  );

  const completedProjects = useMemo(() =>
    projects.filter(p => p.status === 'completed'),
    [projects]
  );

  return {
    projects,
    activeProjects,
    recurringProjects,
    completedProjects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    isAuthenticated: !!user
  };
}
