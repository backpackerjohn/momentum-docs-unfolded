import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FALLBACK_SUGGESTIONS = [
  "Break this phase into even smaller tasks - what's the absolute smallest first step?",
  "Who could you ask for help or advice on this specific challenge?",
  "Try timeboxing: commit to working on this for just 25 minutes without judgment."
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { goal, chunk } = await req.json();
    
    if (!goal || !chunk) {
      return new Response(JSON.stringify({ error: 'Goal and chunk are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Getting stuck suggestions for chunk:', chunk.title);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.warn('LOVABLE_API_KEY not configured, using fallback suggestions');
      return new Response(JSON.stringify({ suggestions: FALLBACK_SUGGESTIONS }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an empathetic productivity coach helping someone who feels stuck.

The user is working toward this goal: "${goal}"
They're stuck on this phase: "${chunk.title}"

Generate 2-3 SHORT, actionable, encouraging suggestions to help them move forward.

Each suggestion should:
- Be practical and specific
- Address common blockers (unclear next step, overwhelm, perfectionism)
- Be encouraging but not condescending
- Be 1-2 sentences max

Return ONLY valid JSON:
{
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

    try {
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Help me get unstuck.' }
          ],
          response_format: { type: "json_object" }
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI API error:', aiResponse.status, await aiResponse.text());
        throw new Error('AI request failed');
      }

      const aiData = await aiResponse.json();
      const result = JSON.parse(aiData.choices[0].message.content);

      console.log('AI generated suggestions:', result);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (aiError) {
      console.error('AI error, using fallback:', aiError);
      return new Response(JSON.stringify({ suggestions: FALLBACK_SUGGESTIONS }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in get-stuck-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      suggestions: FALLBACK_SUGGESTIONS
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
