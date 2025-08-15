import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'broadcast_update':
        const { table, event_type, record_id, user_id } = await req.json()
        
        // Broadcast real-time update to all connected devices
        const { error: broadcastError } = await supabaseClient
          .from('real_time_events')
          .insert({
            table_name: table,
            event_type,
            record_id,
            user_id,
            timestamp: new Date().toISOString(),
            processed: false
          })

        if (broadcastError) throw broadcastError

        return new Response(
          JSON.stringify({ success: true, message: 'Update broadcasted' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'get_updates':
        const since = url.searchParams.get('since')
        const device_user_id = url.searchParams.get('user_id')

        let query = supabaseClient
          .from('real_time_events')
          .select('*')
          .eq('processed', false)
          .order('timestamp', { ascending: true })

        if (since) {
          query = query.gt('timestamp', since)
        }

        const { data: updates } = await query

        // Mark updates as processed for this user
        if (updates && updates.length > 0) {
          await supabaseClient
            .from('real_time_events')
            .update({ processed: true })
            .in('id', updates.map(u => u.id))
        }

        return new Response(
          JSON.stringify({ success: true, updates }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Real-time sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})