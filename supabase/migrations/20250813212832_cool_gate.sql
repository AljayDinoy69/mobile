/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `contact` (text)
      - `address` (text, optional)
      - `role` (text, default 'user')
      - `department` (text, optional)
      - `badge` (text, optional)
      - `status` (text, default 'active')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for authenticated users to read their own data
    - Add policy for admin users to manage all users
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '',
  address text DEFAULT '',
  role text NOT NULL DEFAULT 'user',
  department text DEFAULT '',
  badge text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Policy for users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Policy for admin users to manage all users
CREATE POLICY "Admin users can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Insert default admin user
INSERT INTO users (email, name, contact, role, department)
VALUES (
  'group10@gmail.com',
  'Emergency Administrator',
  'N/A',
  'admin',
  'Emergency Management'
) ON CONFLICT (email) DO NOTHING;