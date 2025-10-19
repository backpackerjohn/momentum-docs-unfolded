import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error("Missing required field: userId");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Finding connections for user:', userId);

    // Get user's thoughts from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: thoughts, error: thoughtsError } = await supabase
      .from('thoughts')
      .select('id, content')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100); // Limit to recent 100 thoughts for performance

    if (thoughtsError) throw thoughtsError;

    if (!thoughts || thoughts.length < 2) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          connections: [],
          message: "Need at least 2 thoughts to find connections"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare thoughts for AI analysis
    const thoughtsForAI = thoughts.map((t, index) => `${index + 1}. "${t.content}"`).join('\n');

    // Call Lovable AI Gateway with Gemini 2.5 Flash
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert at finding meaningful relationships between thoughts and ideas. 
Analyze the numbered thoughts and identify connections between them.

For each connection you find, provide:
- The numbers of the two connected thoughts
- The strength of the connection (Strong, Medium, Weak)
- A brief explanation of why they're connected

Only find genuine, meaningful connections - don't force connections that don't exist.
Focus on:
- Related topics or themes
- Cause-and-effect relationships
- Complementary ideas
- Sequential steps in a process
- Similar problems or solutions

Return ONLY a JSON array in this exact format:
[
  {
    "thought1": 1,
    "thought2": 3,
    "strength": "Strong",
    "reason": "Both thoughts relate to improving productivity through time management"
  }
]`
          },
          {
            role: 'user',
            content: `Find connections between these thoughts:\n\n${thoughtsForAI}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const connectionsText = aiData.choices?.[0]?.message?.content;
    
    if (!connectionsText) {
      throw new Error('No response from AI');
    }

    console.log('AI response:', connectionsText);

    // Parse the JSON response
    let connections: any[] = [];
    try {
      connections = JSON.parse(connectionsText.trim());
      if (!Array.isArray(connections)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', connectionsText);
      connections = [];
    }

    // Convert thought indices back to IDs and validate
    const validConnections = connections.map(conn => {
      const thought1 = thoughts[conn.thought1 - 1]; // Convert 1-based to 0-based index
      const thought2 = thoughts[conn.thought2 - 1];
      
      if (!thought1 || !thought2 || thought1.id === thought2.id) {
        return null;
      }

      return {
        thought1_id: thought1.id,
        thought2_id: thought2.id,
        thought1_content: thought1.content,
        thought2_content: thought2.content,
        strength: conn.strength || 'Medium',
        reason: conn.reason || 'Related concepts'
      };
    }).filter(Boolean);

    console.log(`Found ${validConnections.length} valid connections`);

    // Save connections to database
    const connectionsToInsert = validConnections
      .filter((conn): conn is NonNullable<typeof conn> => conn !== null)
      .map(conn => ({
        user_id: userId,
        thought1_id: conn.thought1_id,
        thought2_id: conn.thought2_id,
        strength: conn.strength,
        reason: conn.reason
      }));

    if (connectionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('connections')
        .upsert(connectionsToInsert, {
          onConflict: 'user_id,thought1_id,thought2_id',
          ignoreDuplicates: false
        });

      if (insertError) {
        console.error('Error saving connections:', insertError);
        // Don't fail the request, just log the error
      } else {
        console.log(`Saved ${connectionsToInsert.length} connections to database`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        connections: validConnections,
        total_thoughts_analyzed: thoughts.length,
        saved_to_database: connectionsToInsert.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in find-connections:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        connections: []
      }),
      { 
        status: 200, // Return 200 so UI doesn't break
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});