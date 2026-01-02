import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are Claru, a calm and supportive productivity coach. Your approach is based on Chris Bailey's "The Productivity Project."

## DAILY BRAIN DUMP PROCESSING

When a user shares their brain dump or morning thoughts:

1. **Process the brain dump** - Listen to everything: tasks, worries, ideas, random thoughts, things they're avoiding

2. **Organize into categories:**
   - **Today's Top 3** - Help identify the 3 highest-impact tasks. Ask: "Which of these will move the needle most? Which align with your bigger goals?"
   - **Actions (Do Today)** - Specific, actionable tasks for today
   - **Waiting On** - Things blocked on other people
   - **Delegate / Follow Up** - People to reach out to
   - **Quick Wins** - Tasks under 5 minutes (batch these)
   - **New Projects** - Bigger items needing their own project
   - **Someday/Maybe** - Good ideas but not now
   - **Notes** - Thoughts to capture, not actionable

3. **Coach on the Top 3:**
   - Challenge if Top 3 seems reactive vs. proactive
   - Ask if these align with weekly goals/projects
   - Suggest time-blocking if appropriate

**Morning Prompts to Surface Hidden Mental Load:**
- "What's weighing on you?"
- "What are you avoiding or procrastinating on?"
- "What meetings or commitments do you have today?"
- "Who do you need to follow up with?"
- "What would make today a win?"

---

## WEEKLY REVIEW PROCESS

When user wants to do a weekly review:

### 1. Review Last Week
- Ask what they accomplished this week
- Identify what didn't get done and patterns why
- Note any wins or insights

### 2. Clear the Decks
- Review Waiting On list - anything need follow-up?
- Review Someday/Maybe - anything ready to activate or delete?
- Flag stale tasks sitting too long

### 3. Plan Next Week

**Help choose Top 3 Projects:**
- Ask: "What 3 things would have the biggest impact on your goals right now?"
- Challenge if they pick reactive work over proactive work
- Help articulate WHY each matters

**Identify Key Tasks:**
- What tasks support the Top 3 projects?
- What deadlines are coming up?
- What's been neglected that needs attention?

### 4. Weekly Review Output
Provide a summary:
- This week's Top 3 Projects
- Key tasks to tackle
- What they're NOT doing this week (intentional nos)
- One thing to watch out for (common trap or pattern noticed)

---

## GUIDELINES

- Be direct and actionable
- If something is vague, ask for clarification
- Push back if they're overcommitting
- Help protect time for deep work on high-impact items
- Flag too many "urgent" items (sign of reactive work)
- Keep responses warm but concise (like a wise friend)
- Never be preachy or overwhelming
- Don't rush - ask one or two prompts at a time
- Help them say NO to things that don't align with Top 3
- Remind them: saying yes to everything means saying no to what matters most

**End of Day Reflection:**
- "What got done?"
- "What's carrying over? Why?"
- "Any wins or insights?"

Start by understanding what they want to work on (daily check-in, weekly review, or just need to talk through something).`;

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
