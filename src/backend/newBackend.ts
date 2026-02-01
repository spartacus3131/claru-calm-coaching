import type { Backend } from './backend';

function notConfigured(method: string): never {
  throw new Error(
    `[backend] "${method}" is not configured. Set VITE_BACKEND_PROVIDER="supabase" (default) or implement the new backend provider.`
  );
}

export const newBackend: Backend = {
  auth: {
    onAuthStateChange: () => notConfigured('auth.onAuthStateChange'),
    getSession: async () => notConfigured('auth.getSession'),
    getUser: async () => notConfigured('auth.getUser'),
    sendOtp: async () => notConfigured('auth.sendOtp'),
    verifyOtp: async () => notConfigured('auth.verifyOtp'),
    signOut: async () => notConfigured('auth.signOut'),
  },
  ai: {
    coachReply: async () => notConfigured('ai.coachReply'),
    transcribe: async () => notConfigured('ai.transcribe'),
  },
  chatMessages: {
    list: async () => notConfigured('chatMessages.list'),
    insert: async () => notConfigured('chatMessages.insert'),
    insertMany: async () => notConfigured('chatMessages.insertMany'),
  },
  dailyNotes: {
    getByDate: async () => notConfigured('dailyNotes.getByDate'),
    upsert: async () => notConfigured('dailyNotes.upsert'),
  },
  projects: {
    list: async () => notConfigured('projects.list'),
    create: async () => notConfigured('projects.create'),
    update: async () => notConfigured('projects.update'),
    remove: async () => notConfigured('projects.remove'),
  },
  parkingLot: {
    list: async () => notConfigured('parkingLot.list'),
    create: async () => notConfigured('parkingLot.create'),
    setCompleted: async () => notConfigured('parkingLot.setCompleted'),
    remove: async () => notConfigured('parkingLot.remove'),
  },
  hotSpots: {
    listAreas: async () => notConfigured('hotSpots.listAreas'),
    listRatings: async () => notConfigured('hotSpots.listRatings'),
    upsertAreas: async () => notConfigured('hotSpots.upsertAreas'),
    upsertRatings: async () => notConfigured('hotSpots.upsertRatings'),
  },
};

