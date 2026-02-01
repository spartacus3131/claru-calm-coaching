import type { ProjectStatus, ProjectType } from './claru';

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

