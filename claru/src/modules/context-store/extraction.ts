/**
 * Extraction Functions - F005 Daily Note Extraction
 *
 * Extracts structured data from AI coaching conversations.
 * Parses Top 3, admin batch, work types from natural language.
 */

import type { Message } from '@/modules/coaching/types';
import { type Top3Item, type WorkType, createTop3Item } from './types';

/**
 * Result of extracting plan data from conversation.
 */
export interface ExtractionResult {
  top3: Top3Item[];
  adminBatch: string[];
  rawDump: string;
}

/**
 * Patterns for detecting Top 3 sections in AI responses.
 */
const TOP3_PATTERNS = [
  /\*\*Top 3:\*\*\n([\s\S]*?)(?=\n\n|\*\*|$)/i,
  /Top 3:\n([\s\S]*?)(?=\n\n|Admin|$)/i,
  /Your Top 3:\n([\s\S]*?)(?=\n\n|$)/i,
];

/**
 * Patterns for detecting admin batch sections.
 */
const ADMIN_BATCH_PATTERNS = [
  /\*\*Admin Batch:\*\*\n([\s\S]*?)(?=\n\n|\*\*|$)/i,
  /Admin Batch:\n([\s\S]*?)(?=\n\n|$)/i,
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
 * Extracts plan data from a conversation.
 *
 * Looks at assistant messages to find structured plan data,
 * and collects user messages as raw dump.
 */
export function extractPlanFromConversation(messages: Message[]): ExtractionResult {
  const result: ExtractionResult = {
    top3: [],
    adminBatch: [],
    rawDump: '',
  };
  
  // Collect user messages as raw dump
  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content);
  result.rawDump = userMessages.join('\n\n');
  
  // Look for structured data in assistant messages (last ones first)
  const assistantMessages = messages
    .filter((m) => m.role === 'assistant')
    .reverse();
  
  for (const message of assistantMessages) {
    // Try to extract Top 3 if not found yet
    if (result.top3.length === 0) {
      result.top3 = extractTop3(message.content);
    }
    
    // Try to extract admin batch if not found yet
    if (result.adminBatch.length === 0) {
      result.adminBatch = extractAdminBatch(message.content);
    }
    
    // Stop if we found both
    if (result.top3.length > 0 && result.adminBatch.length > 0) {
      break;
    }
  }
  
  return result;
}
