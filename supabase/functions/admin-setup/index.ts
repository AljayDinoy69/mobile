import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create protected default admin account
    const defaultAdminEmail = 'admin@emergency-response.system'
    const defaultAdminPassword = 'EmergencyAdmin2024!@#'

    // Check if default admin already exists
    const { data: existingAdmin } = await supabaseClient
      .from('users')
      .select('id')
      .eq('email', defaultAdminEmail)
      .single()

    if (existingAdmin) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Default admin account already exists',
          admin_email: defaultAdminEmail
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the admin user in auth
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: defaultAdminEmail,
      password: defaultAdminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        protected: true,
        created_by: 'system'
      }
    })

    if (authError) {
      throw authError
    }

    // Create the admin profile
    const { error: profileError } = await supabaseClient
      .from('users')
      .insert({
        id: authUser.user.id,
        email: defaultAdminEmail,
        name: 'System Administrator',
        contact: '+1-800-EMERGENCY',
        address: 'Emergency Response Center',
        role: 'admin',
        department: 'System Administration',
        badge: 'ADMIN-001',
        status: 'active'
      })

    if (profileError) {
      throw profileError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Default admin account created successfully',
        admin_email: defaultAdminEmail,
        admin_password: defaultAdminPassword,
        warning: 'Please change the default password immediately after first login'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin setup error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})