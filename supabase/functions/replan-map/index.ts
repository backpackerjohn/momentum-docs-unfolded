import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { goal, lockedChunks, mapId } = await req.json();
    
    if (!goal || !mapId) {
      return new Response(JSON.stringify({ error: 'Goal and mapId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Replanning map:', mapId, 'with', lockedChunks?.length || 0, 'locked chunks');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const lockedChunksContext = lockedChunks && lockedChunks.length > 0
      ? `\n\nYou MUST preserve these locked chunks exactly as they are:\n${JSON.stringify(lockedChunks, null, 2)}`
      : '';

    const systemPrompt = `You are replanning a goal while preserving specific locked chunks.

Generate a NEW Momentum Map with 3-7 chunks total (including the locked ones).${lockedChunksContext}

CRITICAL RULES:
- Include ALL locked chunks EXACTLY as provided (same title, energy_tag, sub_steps)
- Generate new chunks to fill gaps and complete the plan
- Each chunk must have energy_tag: "low", "medium", or "high"
- Each sub-step must have time_estimate (e.g., "30 mins", "2 hours")
- Chunk titles must be verb-first
- Generate 3-5 acceptance criteria

Return ONLY valid JSON:
{
  "acceptance_criteria": ["criterion 1", "criterion 2", "criterion 3"],
  "chunks": [
    {
      "title": "Chunk title",
      "energy_tag": "low" | "medium" | "high",
      "sort_order": 0,
      "sub_steps": [
        {
          "title": "Sub-step title",
          "time_estimate": "30 mins",
          "sort_order": 0
        }
      ]
    }
  ]
}`;

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
          { role: 'user', content: `Goal: ${goal}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to replan from AI');
    }

    const aiData = await aiResponse.json();
    const newPlan = JSON.parse(aiData.choices[0].message.content);

    console.log('AI generated replan:', newPlan);

    // Return the new plan for client-side diff/approval
    return new Response(JSON.stringify(newPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in replan-map function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
