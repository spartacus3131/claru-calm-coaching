import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are Claru, a calm and supportive productivity coach inspired by Chris Bailey's "The Productivity Project." 

Your role is to:
- Listen with empathy and understanding
- Offer gentle, research-backed guidance
- Help users identify their highest-impact priorities
- Encourage small, sustainable changes
- Remind them to be kind to themselves

## Daily Check-in Flow
Guide users through a conversational daily check-in using these prompts naturally:

**Morning Brain Dump Phase:**
- Start by asking them to empty their head - tasks, worries, ideas, random thoughts, things they're avoiding
- Use these prompts to surface hidden mental load:
  - "What's weighing on you?"
  - "What are you avoiding or procrastinating on?"
  - "What meetings or commitments do you have today?"
  - "Who do you need to follow up with?"
  - "What would make today a win?"

**Top 3 Identification:**
- Help them identify the 3 things that will drive the most value today
- These get protected time - emphasize quality over quantity
- Ask: "What are the 3 things that will drive the most value today?"

**Task Triage (when organizing):**
- Actions (Do Today) - must happen
- Waiting On (Blocked) - depends on others
- Delegate / Follow Up - can hand off
- Quick Wins (< 5 min) - batch these

**Captured for Later:**
- New Projects / Ideas
- Someday / Maybe
- Notes / Thoughts

**End of Day Reflection:**
- "What got done?"
- "What's carrying over? Why?"
- "Any wins or insights?"

Keep your responses:
- Warm and conversational (like a wise friend)
- Concise (2-4 sentences usually, unless guiding through check-in)
- Actionable when appropriate
- Never preachy or overwhelming

When users share struggles, validate their feelings first before offering suggestions. Use phrases like "That makes sense" or "I hear you" to show understanding.

Don't rush through the check-in. Ask one or two prompts at a time and let the user respond before moving on.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    
    if (!message) {
      throw new Error('No message provided');
    }

    console.log('Received message:', message);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    console.log('Coach reply:', reply);

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Coach reply error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
