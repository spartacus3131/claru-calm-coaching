import type { Session, User } from '@supabase/supabase-js';
import type { DailyNoteDraft } from '@/types/dailyNote';
import type { Message, Project } from '@/types/claru';
import type { CreateProjectInput, UpdateProjectInput } from '@/types/projects';
import type { HotSpot, HotSpotArea } from '@/types/hotSpots';
import type { CoachReplyInput, CoachReplyOutput } from './types';

export type AuthStateChangeHandler = (event: string, session: Session | null) => void;

export interface Backend {
  auth: {
    onAuthStateChange: (handler: AuthStateChangeHandler) => { unsubscribe: () => void };
    getSession: () => Promise<Session | null>;
    getUser: () => Promise<User | null>;
    sendOtp: (email: string) => Promise<{ error: Error | null }>;
    verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
  };

  ai: {
    coachReply: (input: CoachReplyInput) => Promise<CoachReplyOutput>;
    transcribe: (base64Audio: string) => Promise<string>;
  };

  chatMessages: {
    list: (userId: string) => Promise<Message[]>;
    insert: (
      input: { userId: string; role: 'user' | 'assistant'; content: string; createdAt?: string }
    ) => Promise<{ id: string; created_at: string }>;
    insertMany: (
      inputs: Array<{ userId: string; role: 'user' | 'assistant'; content: string; createdAt: string }>
    ) => Promise<void>;
  };

  dailyNotes: {
    getByDate: (userId: string, noteDate: string) => Promise<DailyNoteDraft | null>;
    upsert: (userId: string, draft: DailyNoteDraft) => Promise<void>;
  };

  projects: {
    list: (userId: string) => Promise<Project[]>;
    create: (userId: string, input: CreateProjectInput) => Promise<Project>;
    update: (userId: string, id: string, input: UpdateProjectInput) => Promise<void>;
    remove: (userId: string, id: string) => Promise<void>;
  };

  parkingLot: {
    list: (
      userId: string
    ) => Promise<Array<{ id: string; content: string; is_completed: boolean; created_at: string }>>;
    create: (userId: string, content: string) => Promise<{ id: string }>;
    setCompleted: (userId: string, id: string, isCompleted: boolean) => Promise<void>;
    remove: (userId: string, id: string) => Promise<void>;
  };

  hotSpots: {
    listAreas: (userId: string) => Promise<HotSpotArea[]>;
    listRatings: (
      userId: string,
      weekStart: string
    ) => Promise<Array<{ area: string; rating: number; updated_at: string }>>;
    upsertAreas: (userId: string, areas: HotSpotArea[]) => Promise<void>;
    upsertRatings: (userId: string, weekStart: string, hotSpots: HotSpot[]) => Promise<void>;
  };
}

