/**
 * Fallback responses when AI is unavailable
 */
export const FALLBACK_RESPONSES = {
  morning: "I'm having trouble connecting right now. While I sort this out, try this: Write down the 3 most important things you want to accomplish today. We can refine them together when I'm back.",
  
  evening: "I'm having trouble connecting right now. Take a moment to jot down: What got done today? What's carrying over? We'll sync up when I'm back.",
  
  generic: "I'm having trouble responding right now. Let's try again in a moment.",
  
  rateLimited: "You've hit your daily limit. Your check-ins reset tomorrow. In the meantime, your daily note is still available for manual capture.",
  
  lowConfidence: "I'm not quite sure I understood that. Could you tell me more about what's on your mind?",
  
  offTopic: "That's interesting! For this check-in though, what's on your plate today?"
} as const;

export type FallbackType = keyof typeof FALLBACK_RESPONSES;

/**
 * Get appropriate fallback response
 */
export function getFallbackResponse(type: FallbackType = 'generic'): string {
  return FALLBACK_RESPONSES[type];
}
