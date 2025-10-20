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

    const { goal } = await req.json();
    if (!goal || typeof goal !== 'string' || goal.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Goal is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (goal.length > 500) {
      return new Response(JSON.stringify({ error: 'Goal must be 500 characters or less' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating map for goal:', goal);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a productivity expert who breaks down large goals into actionable plans.

Generate a Momentum Map with 3-7 chunks (major phases), each containing 3-10 sub-steps.

CRITICAL RULES:
- Each chunk must have an energy_tag: "low", "medium", or "high"
- Each sub-step must have a time_estimate (e.g., "30 mins", "2 hours", "1 day")
- Chunk titles must be verb-first (e.g., "Research audience", "Build prototype")
- Sub-step titles must be concrete, single actions
- Generate 3-5 acceptance criteria for the Finish Line

Return ONLY valid JSON matching this structure:
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
      throw new Error('Failed to generate map from AI');
    }

    const aiData = await aiResponse.json();
    const generatedMap = JSON.parse(aiData.choices[0].message.content);

    console.log('AI generated map:', generatedMap);

    // Validate structure
    if (!generatedMap.chunks || !Array.isArray(generatedMap.chunks)) {
      throw new Error('Invalid map structure from AI');
    }

    if (generatedMap.chunks.length < 3 || generatedMap.chunks.length > 7) {
      throw new Error('AI must generate 3-7 chunks');
    }

    // Create the map
    const { data: mapData, error: mapError } = await supabaseClient
      .from('momentum_maps')
      .insert({
        user_id: user.id,
        goal: goal.trim(),
        ai_generated: true,
        acceptance_criteria: generatedMap.acceptance_criteria || []
      })
      .select()
      .single();

    if (mapError) {
      console.error('Error creating map:', mapError);
      throw mapError;
    }

    console.log('Created map:', mapData.id);

    // Create chunks and sub-steps
    for (const chunk of generatedMap.chunks) {
      const { data: chunkData, error: chunkError } = await supabaseClient
        .from('chunks')
        .insert({
          momentum_map_id: mapData.id,
          title: chunk.title,
          energy_tag: chunk.energy_tag || 'medium',
          sort_order: chunk.sort_order
        })
        .select()
        .single();

      if (chunkError) {
        console.error('Error creating chunk:', chunkError);
        throw chunkError;
      }

      if (chunk.sub_steps && chunk.sub_steps.length > 0) {
        const subStepsToInsert = chunk.sub_steps.map((step: any) => ({
          chunk_id: chunkData.id,
          title: step.title,
          time_estimate: step.time_estimate || '30 mins',
          sort_order: step.sort_order
        }));

        const { error: subStepsError } = await supabaseClient
          .from('sub_steps')
          .insert(subStepsToInsert);

        if (subStepsError) {
          console.error('Error creating sub-steps:', subStepsError);
          throw subStepsError;
        }
      }
    }

    // Fetch complete map with chunks and sub-steps
    const { data: completeMap, error: fetchError } = await supabaseClient
      .from('momentum_maps')
      .select(`
        *,
        chunks (
          *,
          sub_steps (*)
        )
      `)
      .eq('id', mapData.id)
      .single();

    if (fetchError) {
      console.error('Error fetching complete map:', fetchError);
      throw fetchError;
    }

    console.log('Map generation complete:', completeMap.id);

    return new Response(JSON.stringify(completeMap), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-map function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
