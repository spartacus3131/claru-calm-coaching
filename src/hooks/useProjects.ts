import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Project, ProjectType, ProjectStatus } from '@/types/claru';

export interface CreateProjectInput {
  title: string;
  type: ProjectType;
  status?: ProjectStatus;
  goals?: string[];
  blockers?: string[];
  next_actions?: string[];
  recent_progress?: string;
  notes?: string;
}

export interface UpdateProjectInput {
  title?: string;
  type?: ProjectType;
  status?: ProjectStatus;
  goals?: string[];
  blockers?: string[];
  next_actions?: string[];
  recent_progress?: string | null;
  notes?: string | null;
  position?: number;
}

function parseJsonArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
      } else if (data) {
        setProjects(data.map(p => ({
          id: p.id,
          user_id: p.user_id,
          title: p.title,
          type: p.type as ProjectType,
          status: p.status as ProjectStatus,
          goals: parseJsonArray(p.goals),
          blockers: parseJsonArray(p.blockers),
          next_actions: parseJsonArray(p.next_actions),
          recent_progress: p.recent_progress,
          notes: p.notes,
          position: p.position,
          created_at: p.created_at,
          updated_at: p.updated_at
        })));
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

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: input.title,
        type: input.type,
        status: input.status ?? 'active',
        goals: input.goals ?? [],
        blockers: input.blockers ?? [],
        next_actions: input.next_actions ?? [],
        recent_progress: input.recent_progress ?? null,
        notes: input.notes ?? null
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding project:', error);
      setProjects(prev => prev.filter(p => p.id !== tempId));
      if (error.code === '23505') {
        toast.error('A project with this title already exists');
      } else {
        toast.error('Failed to add project');
      }
      return null;
    }

    if (data) {
      const createdProject: Project = {
        ...newProject,
        id: data.id,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
      setProjects(prev =>
        prev.map(p => p.id === tempId ? createdProject : p)
      );
      return createdProject;
    }

    return null;
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

    const { error } = await supabase
      .from('projects')
      .update({
        ...input,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      setProjects(prev =>
        prev.map(p => p.id === id ? project : p)
      );
      if (error.code === '23505') {
        toast.error('A project with this title already exists');
      } else {
        toast.error('Failed to update project');
      }
      return false;
    }

    return true;
  }, [user, projects]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    const project = projects.find(p => p.id === id);
    if (!project) return false;

    setProjects(prev => prev.filter(p => p.id !== id));

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      setProjects(prev => [...prev, project]);
      toast.error('Failed to delete project');
      return false;
    }

    return true;
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
