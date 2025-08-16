/*
  # Create Default Admin Account

  1. New Admin User
    - Creates a default admin account for system management
    - Email: admin@emergency-response.system
    - Role: admin with full system access
    - Protected account that cannot be deleted by regular users

  2. Security
    - Admin has full access to all tables
    - Protected from deletion by non-admin users
    - Proper RLS policies for admin operations
*/

-- Insert default admin user directly into auth.users if not exists
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin already exists
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'admin@emergency-response.system';
  
  -- If admin doesn't exist, create it
  IF admin_user_id IS NULL THEN
    -- Generate a new UUID for the admin
    admin_user_id := gen_random_uuid();
    
    -- Insert into auth.users (this requires service role key)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@emergency-response.system',
      crypt('EmergencyAdmin2024!@#', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "admin", "protected": true}',
      false,
      'authenticated'
    );
    
    -- Insert into public.users table
    INSERT INTO public.users (
      id,
      email,
      name,
      contact,
      address,
      role,
      department,
      badge,
      status
    ) VALUES (
      admin_user_id,
      'admin@emergency-response.system',
      'System Administrator',
      '+1-800-EMERGENCY',
      'Emergency Response Center',
      'admin',
      'System Administration',
      'ADMIN-001',
      'active'
    );
    
    RAISE NOTICE 'Default admin account created successfully';
  ELSE
    RAISE NOTICE 'Default admin account already exists';
  END IF;
END $$;

-- Create additional admin policies
CREATE POLICY IF NOT EXISTS "Protected admin cannot be deleted"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    NOT (email = 'admin@emergency-response.system' AND role = 'admin')
    OR 
    (EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = uid()::text 
      AND role = 'admin' 
      AND email = 'admin@emergency-response.system'
    ))
  );

-- Ensure admin can manage all data
CREATE POLICY IF NOT EXISTS "System admin full access"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = uid()::text 
      AND role = 'admin'
      AND email = 'admin@emergency-response.system'
    )
  );