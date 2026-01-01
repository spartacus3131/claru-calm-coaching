/**
 * Research-backed enhancements for Chris Bailey's 22 Productivity Challenges
 *
 * This file maps peer-reviewed academic research to each challenge,
 * providing evidence-based tips and protocols to enhance the original framework.
 * The core challenges remain true to "The Productivity Project" book.
 */

export interface ResearchEnhancement {
  challengeNumber: number;
  relevantResearch: string[];  // Names of research frameworks that apply
  researchInsight: string;     // Key finding that enhances this challenge
  actionableTip: string;       // Specific research-backed suggestion
  citation?: string;           // Primary source
}

export const CHALLENGE_RESEARCH: ResearchEnhancement[] = [
  // Part 1: Laying the Groundwork
  {
    challengeNumber: 1, // Values Challenge
    relevantResearch: ['Self-Determination Theory', 'Goal-Setting Theory'],
    researchInsight: 'Research shows that goals aligned with your core values (autonomous motivation) lead to 3x more persistence than externally-driven goals.',
    actionableTip: 'When identifying your values, ask: "Would I still want this if no one knew?" Values that pass this test are intrinsically motivating.',
    citation: 'Ryan & Deci (2000), American Psychologist'
  },
  {
    challengeNumber: 2, // Impact Challenge
    relevantResearch: ['Goal-Setting Theory', 'Implementation Intentions'],
    researchInsight: 'Locke & Latham found that focusing on your highest-impact tasks produces effect sizes of d=0.52-0.82 in performance improvement.',
    actionableTip: 'After identifying your high-impact tasks, create if-then plans: "If I sit at my desk, then I start with my #1 impact task."',
    citation: 'Locke & Latham (2019), Motivation Science'
  },
  {
    challengeNumber: 3, // Rule of 3 Challenge
    relevantResearch: ['Working Memory Limits', 'Goal-Setting Theory'],
    researchInsight: 'Working memory holds 4±1 items. Three priorities align with cognitive limits while leaving buffer for unexpected demands.',
    actionableTip: 'Write your 3 intentions on paper—externalizing frees working memory for execution rather than remembering.',
    citation: 'Cowan (2010), Current Directions in Psychological Science'
  },

  // Part 2: Wasting Time
  {
    challengeNumber: 4, // Prime-Time Challenge
    relevantResearch: ['Ultradian Rhythms', 'Circadian Biology'],
    researchInsight: 'Elite performers naturally align with 90-minute ultradian cycles. Workers synced with these rhythms report 40% higher productivity.',
    actionableTip: 'Track energy in 90-minute blocks for 3 days. Note: "low/medium/high" after each block to find your biological prime time.',
    citation: 'Ericsson et al. (1993), Psychological Review'
  },
  {
    challengeNumber: 5, // Flipping Challenge (Procrastination)
    relevantResearch: ['Self-Efficacy Theory', 'Implementation Intentions'],
    researchInsight: 'Bandura showed that low self-efficacy → avoidance → more procrastination. Breaking the cycle requires small wins.',
    actionableTip: 'Shrink the task to 2 minutes. "Just open the document" bypasses the efficacy barrier and often triggers continuation.',
    citation: 'Bandura (1977), Psychological Review'
  },
  {
    challengeNumber: 6, // Time-Traveling Challenge
    relevantResearch: ['Temporal Discounting', 'Future Self-Continuity'],
    researchInsight: 'People who feel connected to their future self save 30% more and make better long-term decisions (Hershfield, 2011).',
    actionableTip: 'Write a letter from your future self thanking present-you for completing this task. Make the future feel real and connected.',
    citation: 'Hershfield et al. (2011), Psychological Science'
  },
  {
    challengeNumber: 7, // Disconnecting Challenge
    relevantResearch: ['Multitasking Research', 'Attention Restoration Theory'],
    researchInsight: 'Stanford research shows heavy multitaskers have inferior working memory and 40% productivity loss per task switch.',
    actionableTip: 'During your 30-min offline period, try a brief nature exposure (even images help). Attention capacity restores ~20% after 20 minutes.',
    citation: 'Ophir, Nass & Wagner (2009), PNAS'
  },

  // Part 3: The End of Time Management
  {
    challengeNumber: 8, // Shrink Your Work Challenge
    relevantResearch: ['Parkinson\'s Law', 'Goal-Setting Theory'],
    researchInsight: 'Locke & Latham: Challenging time constraints increase effort and promote strategic thinking (effect size d=0.52-0.82).',
    actionableTip: 'Set a timer for 75% of your estimated time. The artificial constraint triggers focused problem-solving mode.',
    citation: 'Locke & Latham (2002), American Psychologist'
  },
  {
    challengeNumber: 9, // Working in Prime Time Challenge
    relevantResearch: ['Ultradian Rhythms', 'Flow State Research'],
    researchInsight: 'Flow occurs 3x more during work than leisure (Csikszentmihalyi). Matching challenge to peak energy maximizes flow probability.',
    actionableTip: 'Schedule your single most important task during your #1 energy block. Protect this time like a doctor\'s appointment.',
    citation: 'Csikszentmihalyi & LeFevre (1989), Journal of Personality and Social Psychology'
  },
  {
    challengeNumber: 10, // Maintenance Challenge
    relevantResearch: ['Task Batching', 'Cognitive Load Theory'],
    researchInsight: 'Context-switching costs 40% of productive time (Rubinstein). Batching similar low-value tasks minimizes switching overhead.',
    actionableTip: 'Assign "maintenance mode" a specific uniform (even just changing your hat). Physical cue signals brain to shift into batch mode.',
    citation: 'Rubinstein, Meyer & Evans (2001), Journal of Experimental Psychology'
  },
  {
    challengeNumber: 11, // Zenning Out Challenge
    relevantResearch: ['Attention Restoration Theory', 'Mind-Wandering Research'],
    researchInsight: 'Kaplan: "Soft fascination" in natural/simple environments restores directed attention without depleting it further.',
    actionableTip: 'Set a "zen timer" for low-impact tasks. When it rings, stop even if unfinished. This trains your brain that these tasks have limits.',
    citation: 'Kaplan (1995), Journal of Environmental Psychology'
  },
  {
    challengeNumber: 12, // Delegation Challenge
    relevantResearch: ['Opportunity Cost', 'Self-Determination Theory'],
    researchInsight: 'Deci & Ryan: Delegating controlling tasks preserves autonomy and energy for intrinsically motivating high-impact work.',
    actionableTip: 'Calculate your hourly value (income ÷ work hours). Delegate anything costing less than your hourly rate to reclaim time for high-value work.',
    citation: 'Ryan & Deci (2000), American Psychologist'
  },

  // Part 4: Quiet Your Mind
  {
    challengeNumber: 13, // Capture Challenge
    relevantResearch: ['Working Memory', 'Cognitive Load Theory'],
    researchInsight: 'Open loops consume working memory. Externalizing to-dos frees cognitive resources for actual execution.',
    actionableTip: 'Set a timer for 15 minutes and dump EVERYTHING. Don\'t organize yet—pure capture. Your brain will release tension as each item exits.',
    citation: 'Allen (2001), Getting Things Done; Sweller (1988), Cognitive Science'
  },
  {
    challengeNumber: 14, // Hot Spot Challenge
    relevantResearch: ['Goal-Setting Theory', 'Life Domains Research'],
    researchInsight: 'Research shows that attending to multiple life domains (not just work) correlates with higher well-being and sustainable productivity.',
    actionableTip: 'Rate each hot spot 1-10 weekly. Areas below 5 get one small action this week. Balance prevents burnout.',
    citation: 'Sirgy & Wu (2009), Applied Research in Quality of Life'
  },
  {
    challengeNumber: 15, // Wandering Challenge
    relevantResearch: ['Mind-Wandering & Creativity', 'Incubation Effect'],
    researchInsight: 'Baird et al.: Mind-wandering during breaks increases creative problem-solving and divergent thinking capacity.',
    actionableTip: 'Take a 15-min walk without your phone. Carry a small notepad. Ideas that emerge from unfocused time are often breakthroughs.',
    citation: 'Baird et al. (2012), Psychological Science'
  },

  // Part 5: The Attention Muscle
  {
    challengeNumber: 16, // Notification Challenge
    relevantResearch: ['Multitasking Research', 'Attention Networks'],
    researchInsight: 'Each notification creates a "attention residue"—your mind partially stays on the interruption for 23 minutes (Gloria Mark).',
    actionableTip: 'Use notification scheduling: Check messages at set times (e.g., 9am, 12pm, 5pm). Batch communication like email.',
    citation: 'Mark, Gudith & Klocke (2008), CHI Conference'
  },
  {
    challengeNumber: 17, // Single-Tasking Challenge
    relevantResearch: ['Flow State', 'Deep Work'],
    researchInsight: 'McKinsey found executives in flow state were 500% more productive. Flow requires single-task focus for 15+ minutes.',
    actionableTip: 'Use a physical "focus totem" (object on desk = do not disturb). The visible cue helps others respect your focus and reinforces your own commitment.',
    citation: 'Csikszentmihalyi (1990), Flow: The Psychology of Optimal Experience'
  },
  {
    challengeNumber: 18, // Meditation Challenge
    relevantResearch: ['Mindfulness Meta-Analysis', 'Attention Training'],
    researchInsight: 'Meta-analysis of 111 RCTs: Meditation improves executive attention (g=0.30), working memory (g=0.33), and inhibition (g=0.64).',
    actionableTip: 'Start with 5 minutes of breath focus. When mind wanders (it will), gently return. Each return is one "rep" training your attention muscle.',
    citation: 'Zainal et al. (2023), Cognitive Therapy & Research'
  },

  // Part 6: Taking Productivity to the Next Level
  {
    challengeNumber: 19, // Lamest Diet Challenge
    relevantResearch: ['Glucose & Cognition', 'Tiny Habits'],
    researchInsight: 'Low glycemic meals maintain stable glucose → sustained attention. High GI foods cause attention decline 75-222 min post-meal.',
    actionableTip: 'Add ONE vegetable to ONE meal. Tiny habits (Fogg): Small success → confidence → motivation → more action.',
    citation: 'Sleep Advances (2025) Narrative Review; Fogg (2020)'
  },
  {
    challengeNumber: 20, // Water Challenge
    relevantResearch: ['Hydration & Cognition', 'Habit Formation'],
    researchInsight: 'Even mild dehydration (1-2%) impairs attention, memory, and mood. Most people operate chronically under-hydrated.',
    actionableTip: 'Keep a water bottle visible on your desk. Visual cue + accessibility = automatic habit formation in 21-66 days.',
    citation: 'Masento et al. (2014), British Journal of Nutrition'
  },
  {
    challengeNumber: 21, // Heart Rate Challenge
    relevantResearch: ['Exercise & BDNF', 'Cognitive Performance'],
    researchInsight: 'Exercise increases BDNF (Hedges\' g=0.58), enhancing neuroplasticity, executive function, and working memory.',
    actionableTip: 'A 15-minute brisk walk counts. HIIT is optimal for cognition, but ANY movement that elevates heart rate helps.',
    citation: 'Dinoff et al. (2017), Journal of Sports Medicine'
  },
  {
    challengeNumber: 22, // Sleeping Challenge
    relevantResearch: ['Sleep & Memory Consolidation', 'Circadian Biology'],
    researchInsight: 'Sleep improves memory consolidation with effect size d=0.89 (very strong). Sleep stages have specific cognitive functions.',
    actionableTip: 'Protect the last hour before bed: no screens, cool room (65-68°F), consistent bedtime within 30-min window.',
    citation: 'Hu et al. (2020), Psychological Bulletin'
  },
];

/**
 * Get research enhancement for a specific challenge
 */
export function getResearchForChallenge(challengeNumber: number): ResearchEnhancement | undefined {
  return CHALLENGE_RESEARCH.find(r => r.challengeNumber === challengeNumber);
}

/**
 * Get all research topics mentioned across challenges
 */
export function getAllResearchTopics(): string[] {
  const topics = new Set<string>();
  CHALLENGE_RESEARCH.forEach(r => {
    r.relevantResearch.forEach(topic => topics.add(topic));
  });
  return Array.from(topics).sort();
}
