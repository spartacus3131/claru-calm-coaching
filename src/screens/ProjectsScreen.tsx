import { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Loader2,
  Target,
  AlertCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useProjects, CreateProjectInput, UpdateProjectInput } from '@/hooks/useProjects';
import type { Project, ProjectType, ProjectStatus } from '@/types/claru';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  'active': { label: 'Active', color: 'bg-green-500/20 text-green-600 border-green-500/30' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  'blocked': { label: 'Blocked', color: 'bg-red-500/20 text-red-600 border-red-500/30' },
  'paused': { label: 'Paused', color: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
  'completed': { label: 'Completed', color: 'bg-muted text-muted-foreground border-border' }
};

interface ProjectFormData {
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  goals: string;
  blockers: string;
  next_actions: string;
  recent_progress: string;
  notes: string;
}

const emptyFormData: ProjectFormData = {
  title: '',
  type: 'active',
  status: 'active',
  goals: '',
  blockers: '',
  next_actions: '',
  recent_progress: '',
  notes: ''
};

function ProjectCard({
  project,
  onEdit,
  onDelete
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[project.status];

  return (
    <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-foreground truncate">{project.title}</h3>
            <Badge className={`${statusConfig.color} border text-xs`}>
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {project.goals.length > 0 && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {project.goals.length} goals
              </span>
            )}
            {project.blockers.length > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertCircle className="w-3 h-3" />
                {project.blockers.length} blockers
              </span>
            )}
            {project.next_actions.length > 0 && (
              <span className="flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                {project.next_actions.length} actions
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50 space-y-3">
          {project.goals.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Goals</p>
              <ul className="text-sm text-foreground space-y-1">
                {project.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Target className="w-3 h-3 mt-1 text-accent" />
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.blockers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-1">Blockers</p>
              <ul className="text-sm text-foreground space-y-1">
                {project.blockers.map((blocker, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 mt-1 text-red-500" />
                    {blocker}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.next_actions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Next Actions</p>
              <ul className="text-sm text-foreground space-y-1">
                {project.next_actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ArrowRight className="w-3 h-3 mt-1 text-accent" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {project.recent_progress && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Recent Progress</p>
              <p className="text-sm text-foreground">{project.recent_progress}</p>
            </div>
          )}

          {project.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
            >
              <Edit2 className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectsScreen() {
  const {
    activeProjects,
    recurringProjects,
    completedProjects,
    loading,
    addProject,
    updateProject,
    deleteProject
  } = useProjects();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(emptyFormData);
  const [saving, setSaving] = useState(false);

  const openAddDrawer = (type: ProjectType = 'active') => {
    setEditingProject(null);
    setFormData({ ...emptyFormData, type });
    setDrawerOpen(true);
  };

  const openEditDrawer = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      type: project.type,
      status: project.status,
      goals: project.goals.join('\n'),
      blockers: project.blockers.join('\n'),
      next_actions: project.next_actions.join('\n'),
      recent_progress: project.recent_progress ?? '',
      notes: project.notes ?? ''
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return;

    setSaving(true);

    const projectData = {
      title: formData.title.trim(),
      type: formData.type,
      status: formData.status,
      goals: formData.goals.split('\n').map(s => s.trim()).filter(Boolean),
      blockers: formData.blockers.split('\n').map(s => s.trim()).filter(Boolean),
      next_actions: formData.next_actions.split('\n').map(s => s.trim()).filter(Boolean),
      recent_progress: formData.recent_progress.trim() || null,
      notes: formData.notes.trim() || null
    };

    let success: boolean;
    if (editingProject) {
      success = await updateProject(editingProject.id, projectData as UpdateProjectInput);
    } else {
      const result = await addProject(projectData as CreateProjectInput);
      success = result !== null;
    }

    setSaving(false);

    if (success) {
      setDrawerOpen(false);
      setFormData(emptyFormData);
      setEditingProject(null);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProject(id);
  };

  const renderProjectList = (projects: Project[], emptyMessage: string, type?: ProjectType) => {
    if (projects.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <FolderKanban className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{emptyMessage}</p>
          {type && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => openAddDrawer(type)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add {type === 'recurring' ? 'Recurring' : ''} Project
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={openEditDrawer}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto safe-bottom">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Projects
          </h2>
          <p className="text-sm text-muted-foreground">
            Track your active work and recurring commitments.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="active" className="flex-1">
                Active ({activeProjects.length})
              </TabsTrigger>
              <TabsTrigger value="recurring" className="flex-1">
                <RotateCcw className="w-3 h-3 mr-1" />
                Recurring ({recurringProjects.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1">
                Done ({completedProjects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Button
                variant="outline"
                className="w-full mb-4 border-dashed"
                onClick={() => openAddDrawer('active')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
              {renderProjectList(activeProjects, 'No active projects', 'active')}
            </TabsContent>

            <TabsContent value="recurring">
              <Button
                variant="outline"
                className="w-full mb-4 border-dashed"
                onClick={() => openAddDrawer('recurring')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Recurring Project
              </Button>
              {renderProjectList(recurringProjects, 'No recurring projects', 'recurring')}
            </TabsContent>

            <TabsContent value="completed">
              {renderProjectList(completedProjects, 'No completed projects yet')}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Add/Edit Project Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>
              {editingProject ? 'Edit Project' : 'New Project'}
            </DrawerTitle>
            <DrawerDescription>
              {editingProject
                ? 'Update your project details'
                : 'Add a new project to track'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4 overflow-y-auto">
            <div>
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Project name"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as ProjectType }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as ProjectStatus }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Goals (one per line)</label>
              <Textarea
                value={formData.goals}
                onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                placeholder="What are you trying to achieve?"
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Blockers (one per line)</label>
              <Textarea
                value={formData.blockers}
                onChange={(e) => setFormData(prev => ({ ...prev, blockers: e.target.value }))}
                placeholder="What's blocking progress?"
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Next Actions (one per line)</label>
              <Textarea
                value={formData.next_actions}
                onChange={(e) => setFormData(prev => ({ ...prev, next_actions: e.target.value }))}
                placeholder="What's the next step?"
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Recent Progress</label>
              <Textarea
                value={formData.recent_progress}
                onChange={(e) => setFormData(prev => ({ ...prev, recent_progress: e.target.value }))}
                placeholder="What have you accomplished recently?"
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleSave} disabled={saving || !formData.title.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                editingProject ? 'Save Changes' : 'Add Project'
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
