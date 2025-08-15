/*
  # Device Connections and Real-time Sync Tables

  1. New Tables
    - `device_connections`
      - `id` (uuid, primary key)
      - `device_id` (text, unique device identifier)
      - `user_id` (uuid, foreign key to users)
      - `platform` (text, device platform)
      - `last_seen` (timestamp)
      - `status` (text, online/offline)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `real_time_events`
      - `id` (uuid, primary key)
      - `table_name` (text, affected table)
      - `event_type` (text, insert/update/delete)
      - `record_id` (text, affected record id)
      - `user_id` (uuid, user who triggered event)
      - `timestamp` (timestamp)
      - `processed` (boolean, event processing status)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Device Connections Table
CREATE TABLE IF NOT EXISTS device_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  platform text NOT NULL DEFAULT 'unknown',
  last_seen timestamptz DEFAULT now(),
  status text DEFAULT 'offline',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Real-time Events Table
CREATE TABLE IF NOT EXISTS real_time_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  event_type text NOT NULL,
  record_id text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  processed boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE device_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_events ENABLE ROW LEVEL SECURITY;

-- Device Connections Policies
CREATE POLICY "Users can manage own device connections"
  ON device_connections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all device connections"
  ON device_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Real-time Events Policies
CREATE POLICY "Users can view relevant real-time events"
  ON real_time_events
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'responder')
    )
  );

CREATE POLICY "Authenticated users can create real-time events"
  ON real_time_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_connections_user_id ON device_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_device_connections_status ON device_connections(status);
CREATE INDEX IF NOT EXISTS idx_real_time_events_timestamp ON real_time_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_real_time_events_processed ON real_time_events(processed);
CREATE INDEX IF NOT EXISTS idx_real_time_events_user_id ON real_time_events(user_id);

-- Update timestamp trigger for device_connections
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_device_connections_updated_at 
  BEFORE UPDATE ON device_connections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();