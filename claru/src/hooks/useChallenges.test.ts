/**
 * @file useChallenges.test.ts
 * @description Tests for the useChallenges hook
 * @module hooks
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useChallenges, ChallengeWithStatus, groupChallengesByPart } from './useChallenges';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Sample challenge data for tests
const mockChallenges: ChallengeWithStatus[] = [
  {
    id: 1,
    title: 'The Values Foundation',
    description: 'Define what productivity means to you',
    part: 'clarity',
    partTitle: 'Clarity',
    time: '7 minutes',
    energy: 6,
    value: 8,
    whatYouGet: 'Access to your deeper reasons',
    steps: [{ content: 'Step 1' }],
    userStatus: 'available',
    startedAt: null,
    completedAt: null,
    declinedAt: null,
    data: null,
  },
  {
    id: 2,
    title: 'The Impact Foundation',
    description: 'Identify your highest-impact tasks',
    part: 'clarity',
    partTitle: 'Clarity',
    time: '10 minutes',
    energy: 8,
    value: 10,
    whatYouGet: 'Discover highest-impact tasks',
    steps: [{ content: 'Step 1' }],
    userStatus: 'active',
    startedAt: '2026-01-15T10:00:00Z',
    completedAt: null,
    declinedAt: null,
    data: null,
  },
  {
    id: 8,
    title: 'The Shrink Your Work Foundation',
    description: 'Use time constraints strategically',
    part: 'systems',
    partTitle: 'Systems',
    time: '1 minute',
    energy: 4,
    value: 8,
    whatYouGet: 'Get things done faster',
    steps: [{ content: 'Step 1' }],
    userStatus: 'completed',
    startedAt: '2026-01-10T10:00:00Z',
    completedAt: '2026-01-12T10:00:00Z',
    declinedAt: null,
    data: null,
  },
];

describe('useChallenges', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('fetching challenges', () => {
    it('should fetch challenges on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockChallenges }),
      });

      const { result } = renderHook(() => useChallenges());

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.challenges).toEqual([]);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.challenges).toEqual(mockChallenges);
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith('/api/challenges');
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const { result } = renderHook(() => useChallenges());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.challenges).toEqual([]);
      expect(result.current.error).toBe('Failed to fetch challenges');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useChallenges());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.challenges).toEqual([]);
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('computed properties', () => {
    it('should return active challenges', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockChallenges }),
      });

      const { result } = renderHook(() => useChallenges());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activeChallenges).toHaveLength(1);
      expect(result.current.activeChallenges[0].id).toBe(2);
    });

    it('should return completed challenges', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockChallenges }),
      });

      const { result } = renderHook(() => useChallenges());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.completedChallenges).toHaveLength(1);
      expect(result.current.completedChallenges[0].id).toBe(8);
    });

    it('should return available challenges', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockChallenges }),
      });

      const { result } = renderHook(() => useChallenges());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableChallenges).toHaveLength(1);
      expect(result.current.availableChallenges[0].id).toBe(1);
    });
  });

  describe('updateChallengeStatus', () => {
    it('should update challenge status', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockChallenges }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: { challenge_id: 1, status: 'active', started_at: '2026-02-01T10:00:00Z' },
          }),
        });

      const { result } = renderHook(() => useChallenges());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateChallengeStatus(1, 'active');
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenLastCalledWith('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: 1, status: 'active' }),
      });
    });

    it('should handle update error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockChallenges }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Invalid transition' }),
        });

      const { result } = renderHook(() => useChallenges());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateChallengeStatus(1, 'completed');
        })
      ).rejects.toThrow('Invalid transition');
    });
  });

  describe('startChallenge', () => {
    it('should transition challenge to offered then active', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockChallenges }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { challenge_id: 1, status: 'offered' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { challenge_id: 1, status: 'active' } }),
        });

      const { result } = renderHook(() => useChallenges());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.startChallenge(1);
      });

      // Should have called POST twice (offered, then active)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});

describe('groupChallengesByPart', () => {
  it('should group challenges by journey part', () => {
    const grouped = groupChallengesByPart(mockChallenges);

    expect(grouped.clarity).toHaveLength(2);
    expect(grouped.systems).toHaveLength(1);
    expect(grouped.capacity).toHaveLength(0);
  });

  it('should handle empty array', () => {
    const grouped = groupChallengesByPart([]);

    expect(grouped.clarity).toHaveLength(0);
    expect(grouped.systems).toHaveLength(0);
    expect(grouped.capacity).toHaveLength(0);
  });
});
