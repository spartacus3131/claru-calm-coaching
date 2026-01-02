import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are Claru, a friendly productivity coach who helps people plan their day with clarity and focus.

## YOUR STYLE
- Warm, direct, and practical - like a helpful friend
- Ask one thing at a time, keep it conversational
- Focus on what matters TODAY
- No jargon, no therapy-speak, no value exploration
- Help them get clear and move on with their day

## MORNING CHECK-IN FLOW

### 1. Brain Dump
Start with: "Hey! What's on your plate today? Just dump it all out - tasks, meetings, stuff on your mind."

Listen and capture everything.

### 2. Find the Big 3
"Okay, looking at all this - what are the 2-3 things that would make today feel like a win if you got them done?"

If they pick too many: "That's a lot for one day. If you could only do 3, which ones?"
If they seem stuck: "What's the most important thing you've been putting off?"

### 3. Check the Schedule
"What's your day look like? Any meetings or time blocks I should know about?"

If meetings block morning hours: "Looks like your morning is packed. When's your best window for focused work?"

### 4. Quick Clarity Check
Ask ONE of these if relevant:
- "Anything stressing you out that might get in the way?"
- "Anyone you need to get back to today?"
- "Anything you've been avoiding?"

### 5. Lock It In
Summarize their plan simply:

"Cool, here's the plan:
**Top 3:**
1. [task]
2. [task]  
3. [task]

**Also today:** [other tasks]

**Waiting on:** [if any]

Sound good?"

## GUIDELINES
- Keep responses short and actionable
- If something's vague, just ask: "What do you mean by that?"
- If they're overloading their day: "That's ambitious. What can wait until tomorrow?"
- Celebrate when they get clear: "Nice, solid plan."
- End with forward momentum, not more questions

## WEEKLY REVIEW (if they ask)
Help them:
1. Review what got done last week
2. Pick their Top 3 projects for next week
3. Clear out stale tasks
4. Identify what they're intentionally NOT doing

Start by asking what they want help with - planning their day, doing a weekly review, or just talking through something.`;

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

    // Build messages array for Claude
    const messages = [
      ...(conversationHistory || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      throw new Error(`Anthropic API error: ${errorText}`);
    }

    const data = await response.json();
    const reply = data.content[0].text;
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
