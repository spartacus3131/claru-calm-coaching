/**
 * @file route.ts
 * @description Projects API - F014 CRUD operations
 * @module api/projects
 * 
 * Per bounded-contexts.mdc: Projects belong to User Context Store
 * Per supabase.mdc: RLS + user_id filtering (defense in depth)
 * Per 005-error-handling.mdc: Log errors with context, user-friendly messages
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  toProject,
  toDbInsert,
  toDbUpdate,
} from '@/modules/context-store/projects';

/**
 * GET /api/projects
 * List all projects for the authenticated user.
 * 
 * @query status - Optional filter by status (active, parked, completed)
 * @returns Array of Project entities
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Per supabase.mdc: ALWAYS filter by user_id even with RLS
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch projects:', {
        userId: user.id,
        status,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    const projects = data.map(toProject);
    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error('Projects API GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/projects
 * Create a new project.
 * 
 * @body CreateProjectInput
 * @returns Created Project entity
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Per typescript.mdc: ALWAYS validate external input with Zod
    const parsed = CreateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const dbData = toDbInsert(parsed.data, user.id);

    const { data, error } = await supabase
      .from('projects')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      // Per 005-error-handling.mdc: Handle specific error types
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }
        );
      }

      console.error('Failed to create project:', {
        userId: user.id,
        input: parsed.data,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: toProject(data) }, { status: 201 });
  } catch (error) {
    console.error('Projects API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/projects
 * Update an existing project.
 * 
 * @query id - Project ID (required)
 * @body UpdateProjectInput
 * @returns Updated Project entity
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const parsed = UpdateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const dbData = toDbUpdate(parsed.data);

    // Per supabase.mdc: ALWAYS filter by user_id even with RLS
    const { data, error } = await supabase
      .from('projects')
      .update(dbData)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A project with this name already exists' },
          { status: 409 }
        );
      }

      console.error('Failed to update project:', {
        userId: user.id,
        projectId,
        input: parsed.data,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: toProject(data) });
  } catch (error) {
    console.error('Projects API PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects
 * Delete a project.
 * 
 * @query id - Project ID (required)
 * @returns Success message
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Per supabase.mdc: ALWAYS filter by user_id even with RLS
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete project:', {
        userId: user.id,
        projectId,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Projects API DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
