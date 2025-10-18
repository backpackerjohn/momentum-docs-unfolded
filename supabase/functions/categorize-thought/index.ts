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
    const { thoughtContent, userId } = await req.json();
    
    if (!thoughtContent || !userId) {
      throw new Error("Missing required fields: thoughtContent, userId");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Categorizing thought for user:', userId);

    // Call Lovable AI Gateway with Gemini 2.0 Flash Lite
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are an expert at categorizing thoughts for people with ADHD. 
Analyze the thought and return 1-3 relevant category names that would help organize it.
Categories should be:
- Actionable and clear
- Broad enough to group similar thoughts
- Specific enough to be meaningful
- Common categories: Work, Personal, Ideas, Tasks, Goals, Health, Finance, Learning, Projects, Social

Return ONLY a JSON array of category names, nothing else.
Example: ["Work", "Tasks"]`
          },
          {
            role: 'user',
            content: thoughtContent
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const categoryText = aiData.choices?.[0]?.message?.content;
    
    if (!categoryText) {
      throw new Error('No response from AI');
    }

    console.log('AI response:', categoryText);

    // Parse the JSON array from AI response
    let categories: string[];
    try {
      categories = JSON.parse(categoryText.trim());
      if (!Array.isArray(categories)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', categoryText);
      // Fallback: try to extract category names from text
      categories = categoryText
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0)
        .slice(0, 3);
    }

    // Ensure categories in database exist
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const categoryIds: string[] = [];

    for (const categoryName of categories) {
      // Check if category exists for this user
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', categoryName)
        .single();

      if (existingCategory) {
        categoryIds.push(existingCategory.id);
      } else {
        // Create new category
        const { data: newCategory, error: createError } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: categoryName,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating category:', createError);
        } else if (newCategory) {
          categoryIds.push(newCategory.id);
        }
      }
    }

    console.log('Successfully categorized thought with categories:', categories);

    return new Response(
      JSON.stringify({ 
        success: true, 
        categories,
        categoryIds,
        primaryCategoryId: categoryIds[0] || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in categorize-thought:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        categories: [] 
      }),
      { 
        status: 200, // Return 200 so the thought still saves
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
