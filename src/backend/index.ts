import type { Backend } from './backend';
import { supabaseBackend } from './supabaseBackend';
import { newBackend } from './newBackend';

type BackendProvider = 'supabase' | 'new';

function readProvider(): BackendProvider {
  const raw = import.meta.env.VITE_BACKEND_PROVIDER;
  return raw === 'new' ? 'new' : 'supabase';
}

const provider = readProvider();

export const backend: Backend = provider === 'new' ? newBackend : supabaseBackend;

