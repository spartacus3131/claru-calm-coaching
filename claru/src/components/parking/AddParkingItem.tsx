/**
 * @file AddParkingItem.tsx
 * @description Input component for adding new parked items
 * @module components/parking
 *
 * F026: Quick add interface for parking items.
 */

'use client';

import { useState, useCallback } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CreateParkedItemInput } from '@/modules/parking-lot';

interface AddParkingItemProps {
  onAdd: (input: CreateParkedItemInput) => Promise<unknown>;
  isAtCapacity: boolean;
  className?: string;
}

/**
 * Input for adding new parked items.
 */
export function AddParkingItem({ onAdd, isAtCapacity, className }: AddParkingItemProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmed = text.trim();
      if (!trimmed || isAtCapacity) return;

      setIsSubmitting(true);
      await onAdd({ text: trimmed, source: 'manual' });
      setText('');
      setIsSubmitting(false);
    },
    [text, onAdd, isAtCapacity]
  );

  return (
    <div className={cn('space-y-2', className)}>
      {isAtCapacity && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-700">
            Parking lot is full (50 items). Review and remove some items to add more.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Park something for later..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isAtCapacity || isSubmitting}
          className="flex-1"
          maxLength={500}
        />
        <Button
          type="submit"
          disabled={!text.trim() || isAtCapacity || isSubmitting}
          size="icon"
        >
          <Plus className="w-4 h-4" />
          <span className="sr-only">Add item</span>
        </Button>
      </form>
    </div>
  );
}
