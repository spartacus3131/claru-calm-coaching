/**
 * Extraction Functions - F005 Daily Note Extraction
 *
 * Extracts structured data from AI coaching conversations.
 * Parses Top 3, admin batch, work types from natural language.
 * 
 * Maps conversation phases to Daily Note fields:
 * - Brain dump → rawDump (AI's structured summary, not raw transcript)
 * - "What's weighing on you?" → morningPrompts.weighingOnMe
 * - Meetings mentioned → morningPrompts.meetings
 * - Follow-ups mentioned → morningPrompts.followUps
 * - Top 3 list → top3
 */

import type { Message } from '@/modules/coaching/types';
import { type Top3Item, type WorkType, createTop3Item } from './types';

/**
 * Morning prompts extracted from conversation.
 */
export interface ExtractedMorningPrompts {
  weighingOnMe?: string;
  avoiding?: string;
  meetings?: string;
  followUps?: string;
  win?: string;
}

/**
 * Result of extracting plan data from conversation.
 */
export interface ExtractionResult {
  top3: Top3Item[];
  adminBatch: string[];
  rawDump: string;
  morningPrompts: ExtractedMorningPrompts;
  /** The AI's structured summary of the brain dump */
  structuredSummary?: string;
}

/**
 * Patterns for detecting Top 3 sections in AI responses.
 */
const TOP3_PATTERNS = [
  /\*\*Top 3:\*\*\s*\n([\s\S]*?)(?=\n\n|\*\*|I'll log|Ready to|$)/i,
  /Top 3:\s*\n([\s\S]*?)(?=\n\n|Admin|I'll log|Ready to|$)/i,
  /Your Top 3:\s*\n([\s\S]*?)(?=\n\n|I'll log|Ready to|$)/i,
  /Here's your plan[^:]*:\s*\n([\s\S]*?)(?=\n\n|I'll log|Ready to|$)/i,
  /plan for today:\s*\n([\s\S]*?)(?=\n\n|I'll log|Ready to|$)/i,
  // Numbered list at end of message (likely Top 3)
  /(?:^|\n)(1\.\s+[^\n]+\n2\.\s+[^\n]+\n3\.\s+[^\n]+)/m,
];

/**
 * Patterns for detecting admin batch sections.
 */
const ADMIN_BATCH_PATTERNS = [
  /\*\*Admin Batch:\*\*\s*\n([\s\S]*?)(?=\n\n|\*\*|$)/i,
  /Admin Batch:\s*\n([\s\S]*?)(?=\n\n|$)/i,
  /Quick hits:\s*\n([\s\S]*?)(?=\n\n|$)/i,
];

/**
 * Patterns for detecting structured summary (AI's organization of brain dump).
 */
const STRUCTURED_SUMMARY_PATTERNS = [
  /(?:Here's what I'm capturing|Let me organize|Here's what I'm hearing)[^:]*:\s*\n([\s\S]*?)(?=\n\nWhat's really|Before we|$)/i,
  /(?:I'm capturing|Organizing)[^:]*:\s*\n([\s\S]*?)(?=\n\n|$)/i,
];

/**
 * Patterns for detecting "what's weighing on you" responses.
 */
const WEIGHING_PATTERNS = [
  /(?:what's really (?:weighing|on your mind)|the thing that's weighing)[^?]*\?\s*\n*(.+?)(?:\n\n|$)/i,
  /(?:Actually,? )?(?:the thing that's really (?:weighing|on my mind)|what's weighing on me)[^.]*[.:]\s*(.+?)(?:\n|$)/i,
];

/**
 * Patterns for detecting meetings.
 */
const MEETINGS_PATTERNS = [
  /\*\*Meetings:\*\*\s*\n([\s\S]*?)(?=\n\n|\*\*|$)/i,
  /Meetings?[^:]*:\s*\n?([\s\S]*?)(?=\n\n|\*\*|Deep|Focus|$)/i,
  /(?:standups?|syncs?|calls?)[^,\n]*(?:,\s*[^,\n]+)*/i,
];

/**
 * Patterns for detecting follow-ups.
 */
const FOLLOWUP_PATTERNS = [
  /\*\*Follow[- ]?ups?:\*\*\s*\n([\s\S]*?)(?=\n\n|\*\*|$)/i,
  /(?:follow[- ]?up|waiting on)[^:]*:\s*\n?([\s\S]*?)(?=\n\n|\*\*|$)/i,
];

/**
 * Detects work type from text context clues.
 */
function detectWorkType(text: string): WorkType {
  const lowerText = text.toLowerCase();
  
  // Meeting indicators
  if (
    lowerText.includes('meeting') ||
    lowerText.includes('standup') ||
    lowerText.includes('call') ||
    lowerText.includes('sync') ||
    /\d{1,2}(:\d{2})?\s*(am|pm)/i.test(text)
  ) {
    return 'meeting';
  }
  
  // Admin indicators
  if (
    lowerText.includes('admin') ||
    lowerText.includes('email') ||
    lowerText.includes('inbox') ||
    lowerText.includes('quick') ||
    lowerText.includes('batch') ||
    lowerText.includes('slack') ||
    /\d+\s*min/i.test(text)
  ) {
    return 'admin';
  }
  
  // Deep focus indicators or default
  if (
    lowerText.includes('deep focus') ||
    lowerText.includes('focus') ||
    lowerText.includes('write') ||
    lowerText.includes('spec') ||
    lowerText.includes('deck') ||
    lowerText.includes('document') ||
    /\d+\s*hour/i.test(text)
  ) {
    return 'deep_focus';
  }
  
  // Default to deep_focus for top priorities
  return 'deep_focus';
}

/**
 * Parses a numbered list into array of items.
 */
function parseNumberedList(text: string): string[] {
  const lines = text.split('\n');
  const items: string[] = [];
  
  for (const line of lines) {
    // Match numbered items: "1. Item" or "1) Item"
    const match = line.match(/^\d+[\.\)]\s*(.+)/);
    if (match) {
      items.push(match[1].trim());
    }
  }
  
  return items;
}

/**
 * Parses a bullet list into array of items.
 */
function parseBulletList(text: string): string[] {
  const lines = text.split('\n');
  const items: string[] = [];
  
  for (const line of lines) {
    // Match bullet items: "- Item" or "* Item"
    const match = line.match(/^[-\*]\s*(.+)/);
    if (match) {
      items.push(match[1].trim());
    }
  }
  
  return items;
}

/**
 * Extracts Top 3 items from text content.
 */
function extractTop3(text: string): Top3Item[] {
  for (const pattern of TOP3_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const listText = match[1];
      const items = parseNumberedList(listText);
      
      return items.slice(0, 3).map((itemText) => {
        // Remove work type annotations like "(deep focus)" for cleaner text
        const cleanText = itemText.replace(/\s*\([^)]*\)\s*$/, '').trim();
        return createTop3Item({
          text: cleanText || itemText,
          workType: detectWorkType(itemText),
        });
      });
    }
  }
  
  return [];
}

/**
 * Extracts admin batch items from text content.
 */
function extractAdminBatch(text: string): string[] {
  for (const pattern of ADMIN_BATCH_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return parseBulletList(match[1]);
    }
  }
  
  return [];
}

/**
 * Extracts the AI's structured summary of the brain dump.
 * This is what should go in rawDump, not the raw transcript.
 */
function extractStructuredSummary(text: string): string | null {
  for (const pattern of STRUCTURED_SUMMARY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extracts "what's weighing on me" from user response to that question.
 */
function extractWeighingOnMe(messages: Message[]): string | null {
  // Look for the assistant asking the question, then the user's response
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    if (msg.role === 'assistant' && /what's really (?:weighing|on your mind)/i.test(msg.content)) {
      const nextUserMsg = messages.slice(i + 1).find(m => m.role === 'user');
      if (nextUserMsg) {
        // Clean up the response - take first sentence or two
        const cleaned = nextUserMsg.content
          .split(/[.!?]/)
          .slice(0, 2)
          .join('. ')
          .trim();
        if (cleaned) {
          return cleaned.endsWith('.') ? cleaned : cleaned + '.';
        }
      }
    }
  }
  return null;
}

/**
 * Extracts meetings from AI's structured output.
 */
function extractMeetings(text: string): string | null {
  for (const pattern of MEETINGS_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      // Clean up and return as comma-separated list
      const items = parseBulletList(match[1]);
      if (items.length > 0) {
        return items.join(', ');
      }
      // If it's inline text, return it cleaned
      return match[1].replace(/\n/g, ', ').trim();
    }
  }
  return null;
}

/**
 * Extracts follow-ups from AI's structured output.
 */
function extractFollowUps(text: string): string | null {
  for (const pattern of FOLLOWUP_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const items = parseBulletList(match[1]);
      if (items.length > 0) {
        return items.join(', ');
      }
      return match[1].replace(/\n/g, ', ').trim();
    }
  }
  return null;
}

/**
 * Extracts plan data from a conversation.
 *
 * Looks at assistant messages to find structured plan data.
 * Maps conversation phases to Daily Note fields:
 * - AI's structured summary → rawDump
 * - User's "weighing on me" answer → morningPrompts.weighingOnMe
 * - AI's meetings list → morningPrompts.meetings
 * - AI's follow-ups list → morningPrompts.followUps
 * - AI's Top 3 list → top3
 */
export function extractPlanFromConversation(messages: Message[]): ExtractionResult {
  const result: ExtractionResult = {
    top3: [],
    adminBatch: [],
    rawDump: '',
    morningPrompts: {},
  };
  
  // Look for structured data in assistant messages (last ones first for Top 3)
  const assistantMessages = messages
    .filter((m) => m.role === 'assistant')
    .reverse();
  
  // All assistant messages (chronological) for other extractions
  const assistantMessagesChronological = messages
    .filter((m) => m.role === 'assistant');
  
  let structuredSummary: string | null = null;
  
  for (const message of assistantMessages) {
    // Try to extract Top 3 if not found yet
    if (result.top3.length === 0) {
      result.top3 = extractTop3(message.content);
    }
    
    // Try to extract admin batch if not found yet
    if (result.adminBatch.length === 0) {
      result.adminBatch = extractAdminBatch(message.content);
    }
  }
  
  // Extract structured summary from early assistant messages (chronological)
  for (const message of assistantMessagesChronological) {
    if (!structuredSummary) {
      structuredSummary = extractStructuredSummary(message.content);
    }
    
    // Extract meetings
    if (!result.morningPrompts.meetings) {
      result.morningPrompts.meetings = extractMeetings(message.content) || undefined;
    }
    
    // Extract follow-ups
    if (!result.morningPrompts.followUps) {
      result.morningPrompts.followUps = extractFollowUps(message.content) || undefined;
    }
  }
  
  // Extract "what's weighing on me" from user response to that question
  const weighingOnMe = extractWeighingOnMe(messages);
  if (weighingOnMe) {
    result.morningPrompts.weighingOnMe = weighingOnMe;
  }
  
  // Use structured summary for rawDump if available, otherwise fallback to user messages
  if (structuredSummary) {
    result.rawDump = structuredSummary;
    result.structuredSummary = structuredSummary;
  } else {
    // Fallback: collect user messages as raw dump
    const userMessages = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content);
    result.rawDump = userMessages.join('\n\n');
  }
  
  return result;
}
