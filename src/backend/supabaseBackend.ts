import type { Backend } from './backend';
import { supabase } from '@/integrations/supabase/client';
import type { DailyNoteDraft, DailyNoteTop3Item } from '@/types/dailyNote';
import type { Project, ProjectType, ProjectStatus } from '@/types/claru';
import type { CreateProjectInput, UpdateProjectInput } from '@/types/projects';
import type { CoachReplyInput } from './types';
import { format } from 'date-fns';
import type { HotSpot, HotSpotArea } from '@/types/hotSpots';

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

export const supabaseBackend: Backend = {
  auth: {
    onAuthStateChange: (handler) => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => handler(event, session));
      return { unsubscribe: () => subscription.unsubscribe() };
    },
    getSession: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
    getUser: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
    sendOtp: async (email) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      return { error };
    },
    verifyOtp: async (email, token) => {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      return { error };
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  },

  ai: {
    coachReply: async (input) => {
      const { data, error } = await supabase.functions.invoke('coach-reply', {
        body: {
          message: input.message,
          conversationHistory: input.conversationHistory,
          mode: input.mode,
          foundationDetails: input.foundationDetails,
        } satisfies CoachReplyInput,
      });
      if (error) throw error;
      return data;
    },
    transcribe: async (base64Audio) => {
      const transcribeResponse = await supabase.functions.invoke('transcribe', {
        body: { audio: base64Audio },
      });
      if (transcribeResponse.error) {
        throw new Error(transcribeResponse.error.message || 'Transcription failed');
      }
      const text = transcribeResponse.data?.text;
      if (typeof text !== 'string') throw new Error('Transcription failed');
      return text;
    },
  },

  chatMessages: {
    list: async (userId) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at),
      }));
    },
    insert: async ({ userId, role, content, createdAt }) => {
      const insertPayload: { user_id: string; role: string; content: string; created_at?: string } = {
        user_id: userId,
        role,
        content,
      };
      if (createdAt) insertPayload.created_at = createdAt;

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(insertPayload)
        .select()
        .single();
      if (error) throw error;
      return { id: data.id, created_at: data.created_at };
    },
    insertMany: async (inputs) => {
      if (inputs.length === 0) return;
      const payload = inputs.map((i) => ({
        user_id: i.userId,
        role: i.role,
        content: i.content,
        created_at: i.createdAt,
      }));
      const { error } = await supabase.from('chat_messages').insert(payload);
      if (error) throw error;
    },
  },

  dailyNotes: {
    getByDate: async (userId, noteDate) => {
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('note_date', noteDate)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const morning = (data.morning_prompts ?? {}) as Partial<DailyNoteDraft['morningPrompts']>;
      const top3 = (data.top3 ?? []) as unknown as DailyNoteTop3Item[];
      const organized = (data.organized_tasks ?? {}) as Partial<DailyNoteDraft['organizedTasks']>;
      const eod = (data.end_of_day ?? {}) as Partial<DailyNoteDraft['endOfDay']>;

      return {
        noteDate,
        rawDump: data.raw_dump ?? '',
        morningPrompts: {
          weighingOnMe: morning.weighingOnMe ?? '',
          avoiding: morning.avoiding ?? '',
          meetings: morning.meetings ?? '',
          followUps: morning.followUps ?? '',
          win: morning.win ?? '',
        },
        top3:
          Array.isArray(top3) && top3.length > 0
            ? top3.map((i) => ({ text: i?.text ?? '', completed: !!i?.completed })).slice(0, 10)
            : [
                { text: '', completed: false },
                { text: '', completed: false },
                { text: '', completed: false },
              ],
        organizedTasks: {
          actionsToday: Array.isArray(organized.actionsToday) ? (organized.actionsToday as string[]) : [],
          thisWeek: Array.isArray(organized.thisWeek) ? (organized.thisWeek as string[]) : [],
          decisionsNeeded: Array.isArray(organized.decisionsNeeded) ? (organized.decisionsNeeded as string[]) : [],
          quickWins: Array.isArray(organized.quickWins) ? (organized.quickWins as string[]) : [],
          notes: organized.notes ?? '',
        },
        endOfDay: {
          gotDone: eod.gotDone ?? '',
          carryingOver: eod.carryingOver ?? '',
          wins: eod.wins ?? '',
        },
      };
    },
    upsert: async (userId, draft) => {
      const { error } = await supabase.from('daily_notes').upsert(
        {
          user_id: userId,
          note_date: draft.noteDate ?? format(new Date(), 'yyyy-MM-dd'),
          raw_dump: draft.rawDump,
          morning_prompts: draft.morningPrompts,
          top3: draft.top3,
          organized_tasks: draft.organizedTasks,
          end_of_day: draft.endOfDay,
        },
        { onConflict: 'user_id,note_date' }
      );
      if (error) throw error;
    },
  },

  projects: {
    list: async (userId) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p) => ({
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
        updated_at: p.updated_at,
      }));
    },
    create: async (userId, input: CreateProjectInput) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          title: input.title,
          type: input.type,
          status: input.status ?? 'active',
          goals: input.goals ?? [],
          blockers: input.blockers ?? [],
          next_actions: input.next_actions ?? [],
          recent_progress: input.recent_progress ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      return {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        type: data.type as ProjectType,
        status: data.status as ProjectStatus,
        goals: parseJsonArray(data.goals),
        blockers: parseJsonArray(data.blockers),
        next_actions: parseJsonArray(data.next_actions),
        recent_progress: data.recent_progress,
        notes: data.notes,
        position: data.position,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    },
    update: async (_userId, id, input: UpdateProjectInput) => {
      const { error } = await supabase
        .from('projects')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    remove: async (_userId, id) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
  },

  parkingLot: {
    list: async (userId) => {
      const { data, error } = await supabase
        .from('parking_lot_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((i) => ({
        id: i.id,
        content: i.content,
        is_completed: i.is_completed,
        created_at: i.created_at,
      }));
    },
    create: async (userId, content) => {
      const { data, error } = await supabase
        .from('parking_lot_items')
        .insert({ user_id: userId, content, is_completed: false })
        .select()
        .single();
      if (error) throw error;
      return { id: data.id };
    },
    setCompleted: async (_userId, id, isCompleted) => {
      const { error } = await supabase.from('parking_lot_items').update({ is_completed: isCompleted }).eq('id', id);
      if (error) throw error;
    },
    remove: async (_userId, id) => {
      const { error } = await supabase.from('parking_lot_items').delete().eq('id', id);
      if (error) throw error;
    },
  },

  hotSpots: {
    listAreas: async (userId) => {
      const { data, error } = await supabase.from('hotspot_areas').select('*').eq('user_id', userId).order('position');
      if (error) throw error;
      const rows = data ?? [];
      return rows.map((a): HotSpotArea => ({
        id: a.area_id,
        name: a.name,
        description: a.description,
        color: a.color,
      }));
    },
    listRatings: async (userId, weekStart) => {
      const { data, error } = await supabase
        .from('hotspot_ratings')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        area: r.area,
        rating: r.rating,
        updated_at: r.updated_at,
      }));
    },
    upsertAreas: async (userId, areas) => {
      const upserts = areas.map((area, index) => ({
        user_id: userId,
        area_id: area.id,
        name: area.name,
        description: area.description,
        color: area.color,
        position: index,
      }));
      const { error } = await supabase.from('hotspot_areas').upsert(upserts, { onConflict: 'user_id,area_id' });
      if (error) throw error;
    },
    upsertRatings: async (userId, weekStart, hotSpots: HotSpot[]) => {
      const upserts = hotSpots.map((spot): { user_id: string; week_start: string; area: string; rating: number } => ({
        user_id: userId,
        week_start: weekStart,
        area: spot.id,
        rating: spot.rating,
      }));
      const { error } = await supabase
        .from('hotspot_ratings')
        .upsert(upserts, { onConflict: 'user_id,week_start,area' });
      if (error) throw error;
    },
  },
};

