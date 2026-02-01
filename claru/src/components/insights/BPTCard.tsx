/**
 * @file BPTCard.tsx
 * @description Display component for BPT (Biological Prime Time) analysis results
 * @module components/insights
 *
 * F025: Shows BPT analysis with peak hours and energy patterns.
 * Per domain-language.mdc: Use "Biological Prime Time", "BPT".
 */

'use client';

import { Battery, Clock, Sun, Moon, Sunset } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BPTAnalysis, AnalysisReadiness } from '@/modules/insights/bptAnalysis';

interface BPTCardProps {
  /** BPT analysis results, null if not ready */
  analysis: BPTAnalysis | null;
  /** Analysis readiness status */
  readiness: AnalysisReadiness | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Formats hour number as readable time string.
 *
 * @param hour - Hour (0-23)
 * @returns Formatted time (e.g., "10am", "2pm")
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

/**
 * Progress bar component for readiness.
 */
function ReadinessProgress({ readiness }: { readiness: AnalysisReadiness }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {readiness.currentLogs} of {readiness.requiredLogs} logs
        </span>
        <span className="text-muted-foreground">{readiness.percentComplete}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${readiness.percentComplete}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {readiness.uniqueDays} {readiness.uniqueDays === 1 ? 'day' : 'days'} of data collected
      </p>
    </div>
  );
}

/**
 * Peak hour badge component.
 */
function PeakBadge({
  label,
  hour,
  energy,
  icon: Icon,
}: {
  label: string;
  hour: number;
  energy: number;
  icon: typeof Sun;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{formatHour(hour)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-primary">{energy}/10</p>
      </div>
    </div>
  );
}

/**
 * Energy bar visualization for hourly data.
 */
function EnergyBar({ hour, energy, maxEnergy }: { hour: number; energy: number; maxEnergy: number }) {
  const heightPercent = (energy / maxEnergy) * 100;
  const isHighEnergy = energy >= 7;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="h-16 w-4 bg-muted rounded-full overflow-hidden relative">
        <div
          className={cn(
            'absolute bottom-0 w-full rounded-full transition-all duration-300',
            isHighEnergy ? 'bg-primary' : 'bg-primary/50'
          )}
          style={{ height: `${heightPercent}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{formatHour(hour).replace(/[ap]m/, '')}</span>
    </div>
  );
}

/**
 * BPT analysis card component.
 * Shows either analysis results or progress toward having enough data.
 */
export function BPTCard({ analysis, readiness, className }: BPTCardProps) {
  // Not enough data yet
  if (!analysis && readiness) {
    return (
      <div className={cn('p-4 rounded-xl bg-card border border-border', className)}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Battery className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Biological Prime Time</h3>
            <p className="text-sm text-muted-foreground">
              Keep logging energy to discover your peak hours
            </p>
          </div>
        </div>
        <ReadinessProgress readiness={readiness} />
      </div>
    );
  }

  // No data at all
  if (!analysis) {
    return (
      <div className={cn('p-4 rounded-xl bg-card border border-border', className)}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Battery className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Biological Prime Time</h3>
            <p className="text-sm text-muted-foreground">
              Start logging energy levels to discover when you&apos;re at your best
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full analysis available
  const { overallPeak, morningPeak, afternoonPeak, eveningPeak, hourlyAverages, totalLogs, uniqueDays } =
    analysis;

  // Find max energy for scaling bars
  const maxEnergy = Math.max(...hourlyAverages.map((h) => h.averageEnergy), 10);

  return (
    <div className={cn('p-4 rounded-xl bg-card border border-border', className)}>
      {/* Header with overall peak */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">Your Biological Prime Time</h3>
          <p className="text-lg font-semibold text-primary">{formatHour(overallPeak.hour)}</p>
          <p className="text-xs text-muted-foreground">
            Peak energy: {overallPeak.averageEnergy}/10 (from {totalLogs} logs over {uniqueDays} days)
          </p>
        </div>
      </div>

      {/* Period peaks */}
      <div className="space-y-2 mb-4">
        {morningPeak && (
          <PeakBadge
            label="Morning"
            hour={morningPeak.peakHour}
            energy={morningPeak.averageEnergy}
            icon={Sun}
          />
        )}
        {afternoonPeak && (
          <PeakBadge
            label="Afternoon"
            hour={afternoonPeak.peakHour}
            energy={afternoonPeak.averageEnergy}
            icon={Sunset}
          />
        )}
        {eveningPeak && (
          <PeakBadge
            label="Evening"
            hour={eveningPeak.peakHour}
            energy={eveningPeak.averageEnergy}
            icon={Moon}
          />
        )}
      </div>

      {/* Hourly visualization */}
      {hourlyAverages.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground mb-2">Energy by hour</p>
          <div className="flex justify-between gap-1 overflow-x-auto pb-2">
            {hourlyAverages.map((h) => (
              <EnergyBar key={h.hour} hour={h.hour} energy={h.averageEnergy} maxEnergy={maxEnergy} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-sm text-foreground/80">
          Schedule your most important work around {formatHour(overallPeak.hour)} to align with your
          natural energy peak.
        </p>
      </div>
    </div>
  );
}
