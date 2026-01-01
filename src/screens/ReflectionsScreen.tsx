import { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { ReflectionCard } from '@/components/reflections/ReflectionCard';
import { mockReflections } from '@/data/mockData';
import { format, isToday, isYesterday } from 'date-fns';

export function ReflectionsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReflections = mockReflections.filter((r) =>
    r.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedReflections = filteredReflections.reduce((acc, reflection) => {
    let group: string;
    if (isToday(reflection.date)) {
      group = 'Today';
    } else if (isYesterday(reflection.date)) {
      group = 'Yesterday';
    } else {
      group = format(reflection.date, 'EEEE, MMMM d');
    }

    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(reflection);
    return acc;
  }, {} as Record<string, typeof mockReflections>);

  const isEmpty = filteredReflections.length === 0;

  return (
    <div className="flex-1 overflow-y-auto safe-bottom">
      <div className="p-4">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reflections..."
            className="w-full bg-secondary/50 text-foreground placeholder:text-muted-foreground rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-calm"
          />
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No reflections yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Start your morning or evening check-in to capture your thoughts.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedReflections).map(([date, reflections]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {date}
                </h3>
                <div className="space-y-3">
                  {reflections.map((reflection) => (
                    <ReflectionCard key={reflection.id} reflection={reflection} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
