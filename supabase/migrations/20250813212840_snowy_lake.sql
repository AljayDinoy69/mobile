/*
  # Create reports table

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `full_name` (text)
      - `contact_number` (text)
      - `chief_complaint` (text)
      - `person_involved` (text)
      - `description` (text)
      - `photo_url` (text, optional)
      - `location_lat` (numeric)
      - `location_lng` (numeric)
      - `status` (text, default 'Awaiting Assessment')
      - `priority` (text, default 'medium')
      - `responders` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `reports` table
    - Add policies for users to manage their own reports
    - Add policies for responders and admins to view assigned reports
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  full_name text NOT NULL DEFAULT '',
  contact_number text NOT NULL DEFAULT '',
  chief_complaint text NOT NULL DEFAULT '',
  person_involved text NOT NULL DEFAULT '',
  description text DEFAULT '',
  photo_url text DEFAULT '',
  location_lat numeric,
  location_lng numeric,
  status text NOT NULL DEFAULT 'Awaiting Assessment',
  priority text NOT NULL DEFAULT 'medium',
  responders text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own reports
CREATE POLICY "Users can read own reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Policy for users to create reports
CREATE POLICY "Users can create reports"
  ON reports
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

-- Policy for users to update their own reports
CREATE POLICY "Users can update own reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Policy for responders to view assigned reports
CREATE POLICY "Responders can view assigned reports"
  ON reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND (role = 'responder' OR role = 'admin')
      AND email = ANY(responders)
    )
  );

-- Policy for admins to manage all reports
CREATE POLICY "Admin users can manage all reports"
  ON reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );