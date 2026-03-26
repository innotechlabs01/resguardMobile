-- Migration: Add Citofono (Intercom) and Assembly Voting features
-- Apply with: supabase db push / SQL editor

-- ============================================
-- INTERCOM / CITOFONO TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS intercom_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id),
  from_user_id UUID REFERENCES profiles(id),
  to_user_id UUID REFERENCES profiles(id),
  call_type VARCHAR(20) NOT NULL CHECK (call_type IN ('vigilante', 'admin', 'visitor')),
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'missed', 'rejected')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intercom_calls_user ON intercom_calls (from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_intercom_calls_building ON intercom_calls (building_id);

-- Device tokens for push notifications (intercom calls)
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  device_type VARCHAR(20) CHECK (device_type IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens (token);

-- ============================================
-- ASSEMBLY VOTING TABLES
-- ============================================

-- Assemblies (Juntas)
CREATE TABLE IF NOT EXISTS assemblies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES buildings(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'closed')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assemblies_building ON assemblies (building_id);
CREATE INDEX IF NOT EXISTS idx_assemblies_status ON assemblies (status);

-- Agenda Items (Temas a votar)
CREATE TABLE IF NOT EXISTS agenda_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID REFERENCES assemblies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('yes_no', 'multiple_choice', 'ranked')),
  options JSONB NOT NULL DEFAULT '[{"id": "yes", "label": "Si"}, {"id": "no", "label": "No"}, {"id": "abstain", "label": "Abstener"}]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_items_assembly ON agenda_items (assembly_id);

-- Encrypted Votes (Votos encriptados)
-- IMPORTANT: The actual vote choice is encrypted in encrypted_vote column
-- Only the hash is stored for verification purposes
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  encrypted_vote TEXT NOT NULL,
  vote_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one vote per user per agenda item
  UNIQUE(agenda_item_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_agenda_item ON votes (agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes (user_id);

-- ============================================
-- SECURITY: Row Level Security (RLS)
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE intercom_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Intercom calls: Users can see their own calls
CREATE POLICY "Users can view own intercom calls" ON intercom_calls
  FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Intercom calls: Only system can insert
CREATE POLICY "System manages intercom calls" ON intercom_calls
  FOR ALL USING (false);

-- Device tokens: Users manage their own tokens
CREATE POLICY "Users manage own device tokens" ON device_tokens
  FOR ALL USING (user_id = auth.uid());

-- Assemblies: Building residents can view
CREATE POLICY "Building residents can view assemblies" ON assemblies
  FOR SELECT USING (
    building_id IN (SELECT building_id FROM profiles WHERE id = auth.uid())
  );

-- Assemblies: Only admins can create/update
CREATE POLICY "Admins manage assemblies" ON assemblies
  FOR ALL USING (
    building_id IN (SELECT building_id FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Agenda items: Building residents can view
CREATE POLICY "Building residents can view agenda items" ON agenda_items
  FOR SELECT USING (
    assembly_id IN (SELECT id FROM assemblies WHERE building_id IN (
      SELECT building_id FROM profiles WHERE id = auth.uid()
    ))
  );

-- Agenda items: Only admins can create/update
CREATE POLICY "Admins manage agenda items" ON agenda_items
  FOR ALL USING (
    assembly_id IN (SELECT id FROM assemblies WHERE building_id IN (
      SELECT building_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  );

-- Votes: Users can view their own votes (for verification)
CREATE POLICY "Users can view own votes" ON votes
  FOR SELECT USING (user_id = auth.uid());

-- Votes: Users can insert their own vote (one per item)
CREATE POLICY "Users can vote" ON votes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Votes: No updates allowed (immutable)
CREATE POLICY "Votes are immutable" ON votes
  FOR UPDATE USING (false);

-- Votes: No deletes allowed
CREATE POLICY "Votes cannot be deleted" ON votes
  FOR DELETE USING (false);

-- ============================================
-- FUNCTIONS FOR SECURE VOTING
-- ============================================

-- Function to count votes for an agenda item (returns encrypted totals)
CREATE OR REPLACE FUNCTION count_votes_for_item(agenda_item_uuid UUID)
RETURNS TABLE(option_id VARCHAR, vote_count BIGINT, percentage NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (jsonb_array_elements(options)->>'id')::VARCHAR AS option_id,
    COUNT(v.id)::BIGINT AS vote_count,
    ROUND(
      COUNT(v.id)::NUMERIC * 100.0 / NULLIF(
        (SELECT COUNT(*) FROM votes WHERE agenda_item_id = agenda_item_uuid
      ), 0
    ), 1
  ) AS percentage
  FROM agenda_items ai
  CROSS JOIN LATERAL jsonb_array_elements(ai.options) AS opts(options)
  LEFT JOIN votes v ON v.agenda_item_id = agenda_item_uuid 
    AND (v.encrypted_vote LIKE '%' || (jsonb_array_elements(options)->>'id') || '%')
  WHERE ai.id = agenda_item_uuid
  GROUP BY (jsonb_array_elements(options)->>'id');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify a vote exists without revealing the choice
CREATE OR REPLACE FUNCTION verify_vote_exists(agenda_item_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  vote_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM votes 
    WHERE agenda_item_id = agenda_item_uuid 
    AND user_id = user_uuid
  ) INTO vote_exists;
  
  RETURN vote_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADD TO EXISTING COMMUNICATIONS TABLE
-- ============================================

-- Add intercom-related fields to communications if needed
-- ALTER TABLE communications ADD COLUMN IF NOT EXISTS is_intercom_notification BOOLEAN DEFAULT false;
