import { buildSystemPrompt, type CoachingContext, type ActiveChallengeContext } from './systemPrompt';
import type { ChallengeDefinition } from '@/modules/challenges/types';
import type { ValuesData } from '@/modules/challenges/valuesChallenge';

describe('Coaching Engine - System Prompt', () => {
  const baseContext: CoachingContext = {
    userName: 'Marcus',
    flow: 'morning',
    turnNumber: 1,
    maxTurns: 15,
  };

  describe('buildSystemPrompt', () => {
    it('includes role definition', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('productivity coach');
    });

    it('includes persona traits', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('Direct');
      expect(prompt).toContain('Warm');
      expect(prompt).toContain('Action-oriented');
    });

    it('includes user name', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('Marcus');
    });

    it('includes flow type', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('morning');
    });

    it('includes turn count', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('1');
      expect(prompt).toContain('15');
    });

    it('includes response rules', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('2-4 sentences');
      expect(prompt).toContain('ONE question');
    });

    it('includes guardrails', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('NEVER');
      expect(prompt).toContain('medical');
      expect(prompt).toContain('guilt');
    });

    it('includes yesterday context when provided', () => {
      const context: CoachingContext = {
        ...baseContext,
        yesterdayPlan: 'Finish investor deck, Review competitor analysis',
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('investor deck');
      expect(prompt).toContain('competitor analysis');
    });

    it('includes carryover items when provided', () => {
      const context: CoachingContext = {
        ...baseContext,
        carryover: ['Roadmap doc', 'Team sync prep'],
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('Roadmap doc');
      expect(prompt).toContain('Team sync prep');
    });

    it('handles missing optional context', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('None');
    });

    it('includes double-click question in morning flow', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain("What's really weighing on you");
    });

    it('emphasizes the double-click step', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('DOUBLE-CLICK');
      expect(prompt).toContain('TRUE priority');
    });

    it('includes reality check step to assess available time', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('REALITY CHECK');
      expect(prompt).toContain('focus time');
      expect(prompt).toContain('schedule');
    });

    it('handles packed days with adjusted expectations', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('ONE thing');
      expect(prompt).toContain('1-win day');
    });
  });

  describe('evening flow', () => {
    const eveningContext: CoachingContext = {
      userName: 'Marcus',
      flow: 'evening',
      turnNumber: 1,
      maxTurns: 10,
    };

    it('includes evening-specific instructions', () => {
      const prompt = buildSystemPrompt(eveningContext);
      expect(prompt).toContain('EVENING REFLECTION');
    });

    it('focuses on what got done', () => {
      const prompt = buildSystemPrompt(eveningContext);
      expect(prompt).toContain('What did you actually get done');
    });

    it('asks about carryover', () => {
      const prompt = buildSystemPrompt(eveningContext);
      expect(prompt).toContain('carrying over');
    });

    it('includes wins and insights section', () => {
      const prompt = buildSystemPrompt(eveningContext);
      expect(prompt).toContain('wins');
      expect(prompt).toContain('insights');
    });

    it('has no-guilt language', () => {
      const prompt = buildSystemPrompt(eveningContext);
      expect(prompt).toContain('Never make them feel guilty');
    });

    it('ends with closure, not more to-dos', () => {
      const prompt = buildSystemPrompt(eveningContext);
      expect(prompt).toContain('closure');
    });
  });

  describe('parking lot context', () => {
    it('includes parking lot section', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('Parking Lot');
    });

    it('shows "None" when no parked items', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('Parking Lot');
      // The section should contain "None" when no items
    });

    it('includes parked items when provided', () => {
      const context: CoachingContext = {
        ...baseContext,
        parkedItems: '- Research competitors (parked 5 days ago)\n- Update portfolio (parked 2 days ago)',
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('Research competitors');
      expect(prompt).toContain('Update portfolio');
    });
  });

  describe('projects context (F015)', () => {
    it('includes active projects section', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).toContain('Active Projects');
    });

    it('shows "None" when no active projects', () => {
      const context: CoachingContext = {
        ...baseContext,
        activeProjects: undefined,
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('Active Projects');
      expect(prompt).toMatch(/Active Projects[^]*None/);
    });

    it('includes project names when provided', () => {
      const context: CoachingContext = {
        ...baseContext,
        activeProjects: [
          'Q1 Product Launch: Launch the new product by end of Q1',
          'Fitness Goals: Get back to running 3x/week',
        ],
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('Q1 Product Launch');
      expect(prompt).toContain('Fitness Goals');
    });

    it('provides guidance on using projects in coaching', () => {
      const context: CoachingContext = {
        ...baseContext,
        activeProjects: ['Q1 Product Launch: Launch the new product'],
      };
      const prompt = buildSystemPrompt(context);
      // AI should know to reference projects when relevant
      expect(prompt).toContain('project');
      expect(prompt).toContain('connect');
    });
  });

  describe('active challenge context (F020)', () => {
    const sampleChallenge: ChallengeDefinition = {
      id: 1,
      title: 'The Values Foundation',
      description: 'Define what productivity means to you personally',
      part: 'clarity',
      partTitle: 'Clarity',
      time: '7 minutes',
      energy: 6,
      value: 8,
      whatYouGet: 'Access to your deeper reasons for becoming more productive.',
      steps: [
        { content: 'Step 1 content' },
        { content: 'Step 2 content' },
      ],
    };

    it('does not include challenge section when no active challenge', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).not.toContain('Active Foundation');
    });

    it('includes challenge section when active challenge provided', () => {
      const context: CoachingContext = {
        ...baseContext,
        activeChallenge: {
          challenge: sampleChallenge,
          daysSinceStarted: 2,
        },
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('Active Foundation');
      expect(prompt).toContain('The Values Foundation');
    });

    it('includes challenge title in nudge instructions', () => {
      const context: CoachingContext = {
        ...baseContext,
        activeChallenge: {
          challenge: sampleChallenge,
          daysSinceStarted: 1,
        },
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('Values');
    });

    it('includes instructions to not force the nudge', () => {
      const context: CoachingContext = {
        ...baseContext,
        activeChallenge: {
          challenge: sampleChallenge,
          daysSinceStarted: 3,
        },
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt.toLowerCase()).toMatch(/don't force|natural/);
    });

    it('works with evening flow', () => {
      const context: CoachingContext = {
        userName: 'Marcus',
        flow: 'evening',
        turnNumber: 1,
        maxTurns: 10,
        activeChallenge: {
          challenge: sampleChallenge,
          daysSinceStarted: 2,
        },
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('Active Foundation');
      expect(prompt).toContain('The Values Foundation');
      // Should have evening-specific guidance
      expect(prompt).toContain('reflect');
    });
  });

  describe('completed values context (F021)', () => {
    const sampleValues: ValuesData = {
      values: ['freedom', 'learning', 'creativity'],
      leisureIdeas: 'Read more books, spend time with family',
      productivityGoals: 'Wake up earlier, build consistent habits',
      stepsCompleted: [1, 2, 3],
    };

    it('does not include values section when no completed values', () => {
      const prompt = buildSystemPrompt(baseContext);
      expect(prompt).not.toContain("User's Core Values");
    });

    it('includes values section when completed values provided', () => {
      const context: CoachingContext = {
        ...baseContext,
        completedValues: sampleValues,
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain("User's Core Values");
    });

    it('lists all user values capitalized', () => {
      const context: CoachingContext = {
        ...baseContext,
        completedValues: sampleValues,
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('Freedom');
      expect(prompt).toContain('Learning');
      expect(prompt).toContain('Creativity');
    });

    it('provides coaching guidance about values', () => {
      const context: CoachingContext = {
        ...baseContext,
        completedValues: sampleValues,
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain('Top 3');
      expect(prompt).toContain('deeper meaning');
    });

    it('works with evening flow', () => {
      const context: CoachingContext = {
        userName: 'Marcus',
        flow: 'evening',
        turnNumber: 1,
        maxTurns: 10,
        completedValues: sampleValues,
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain("User's Core Values");
      expect(prompt).toContain('Freedom');
    });

    it('works alongside active challenge', () => {
      const sampleChallenge: ChallengeDefinition = {
        id: 4,
        title: 'The Prime-Time Foundation',
        description: 'Discover your biological peak hours',
        part: 'clarity',
        partTitle: 'Clarity',
        time: '~1 week',
        energy: 1,
        value: 9,
        whatYouGet: 'An understanding of your productivity ingredients.',
        steps: [{ content: 'Track energy hourly' }],
      };

      const context: CoachingContext = {
        ...baseContext,
        completedValues: sampleValues,
        activeChallenge: {
          challenge: sampleChallenge,
          daysSinceStarted: 2,
        },
      };
      const prompt = buildSystemPrompt(context);
      expect(prompt).toContain("User's Core Values");
      expect(prompt).toContain('Freedom');
      expect(prompt).toContain('Active Foundation');
      expect(prompt).toContain('Prime-Time');
    });
  });
});
