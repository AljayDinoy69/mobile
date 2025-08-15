import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface SyncRequest {
  action: 'sync_user' | 'sync_reports' | 'sync_all' | 'heartbeat'
  user_id?: string
  device_id: string
  platform: string
  last_sync?: string
  data?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, user_id, device_id, platform, last_sync, data }: SyncRequest = await req.json()

    // Log device connection
    await supabaseClient
      .from('device_connections')
      .upsert({
        device_id,
        platform,
        user_id,
        last_seen: new Date().toISOString(),
        status: 'online'
      })

    let response_data = {}

    switch (action) {
      case 'heartbeat':
        // Keep device connection alive
        response_data = { status: 'alive', server_time: new Date().toISOString() }
        break

      case 'sync_user':
        if (user_id) {
          const { data: user_data } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', user_id)
            .single()
          
          response_data = { user: user_data }
        }
        break

      case 'sync_reports':
        if (user_id) {
          const { data: user } = await supabaseClient
            .from('users')
            .select('role, email')
            .eq('id', user_id)
            .single()

          let reports_query = supabaseClient.from('reports').select('*')
          
          if (user?.role === 'admin') {
            // Admin gets all reports
          } else if (user?.role === 'responder') {
            // Responder gets assigned reports
            reports_query = reports_query.contains('responders', [user.email])
          } else {
            // Regular user gets their own reports
            reports_query = reports_query.eq('user_id', user_id)
          }

          const { data: reports } = await reports_query.order('created_at', { ascending: false })
          response_data = { reports }
        }
        break

      case 'sync_all':
        // Full synchronization
        if (user_id) {
          const { data: user } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', user_id)
            .single()

          const { data: all_users } = await supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })

          let reports_query = supabaseClient.from('reports').select('*')
          
          if (user?.role === 'admin') {
            // Admin gets everything
          } else if (user?.role === 'responder') {
            reports_query = reports_query.contains('responders', [user.email])
          } else {
            reports_query = reports_query.eq('user_id', user_id)
          }

          const { data: reports } = await reports_query.order('created_at', { ascending: false })

          response_data = {
            user,
            users: user?.role === 'admin' ? all_users : [],
            reports,
            sync_timestamp: new Date().toISOString()
          }
        }
        break
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: response_data,
        server_timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Sync handler error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        server_timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})