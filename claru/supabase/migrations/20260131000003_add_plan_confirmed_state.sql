-- ============================================
-- F007: Add plan_confirmed state to session_state enum
-- ============================================
-- Per state-machines.mdc:
-- States: created → in_progress → plan_confirmed → completed
--                            ↘ abandoned

-- Add the new state to the enum
ALTER TYPE session_state ADD VALUE IF NOT EXISTS 'plan_confirmed' AFTER 'in_progress';

-- Update the unique index to include plan_confirmed as active
DROP INDEX IF EXISTS idx_one_active_session_per_user;

CREATE UNIQUE INDEX idx_one_active_session_per_user 
  ON coaching_sessions(user_id) 
  WHERE state IN ('created', 'in_progress', 'plan_confirmed');
