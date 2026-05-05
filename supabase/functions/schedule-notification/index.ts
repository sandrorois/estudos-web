import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { endAt, title, body } = await req.json()

  // Cancela notificações pendentes anteriores
  await supabase
    .from('timer_notifications')
    .update({ sent: true })
    .eq('user_id', user.id)
    .eq('sent', false)

  await supabase.from('timer_notifications').insert({
    user_id: user.id,
    end_at: endAt,
    title,
    body,
  })

  return new Response('ok', { status: 200 })
})
