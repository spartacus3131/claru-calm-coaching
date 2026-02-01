/**
 * @file ParkingLotItem.tsx
 * @description Display component for a single parked item
 * @module components/parking
 *
 * F026: Displays parked item with actions.
 * Per domain-language.mdc: Use "parked" not "deferred".
 */

'use client';

import { useState } from 'react';
import { MoreVertical, RotateCcw, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ParkedItem } from '@/modules/parking-lot';
import { getDaysParked, isStale, formatDaysParkedLabel } from '@/modules/parking-lot';

interface ParkingLotItemProps {
  item: ParkedItem;
  onReactivate: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

/**
 * Single parked item display with actions.
 */
export function ParkingLotItem({ item, onReactivate, onDelete }: ParkingLotItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const daysParked = getDaysParked(item);
  const stale = isStale(item);
  const daysLabel = formatDaysParkedLabel(daysParked);

  const handleReactivate = async () => {
    setIsReactivating(true);
    await onReactivate(item.id);
    setIsReactivating(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(item.id);
    setIsDeleting(false);
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border bg-card transition-colors',
        stale && 'border-yellow-500/50 bg-yellow-500/5'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-foreground">{item.text}</p>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{daysLabel}</span>
            </div>

            {stale && (
              <div className="flex items-center gap-1 text-xs text-yellow-600">
                <AlertTriangle className="w-3 h-3" />
                <span>Needs review</span>
              </div>
            )}

            {item.reason && (
              <span className="text-xs text-muted-foreground">· {item.reason}</span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleReactivate}
              disabled={isReactivating}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {isReactivating ? 'Reactivating...' : 'Reactivate'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Removing...' : 'Remove'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
