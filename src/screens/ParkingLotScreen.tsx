import { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, X, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useParkingLot } from '@/hooks/useParkingLot';

export function ParkingLotScreen() {
  const { items, loading, addItem, toggleItem, deleteItem } = useParkingLot();
  const [newItem, setNewItem] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    await addItem(newItem.trim());
    setNewItem('');
    setIsAdding(false);
  };

  const activeItems = items.filter(i => !i.isCompleted);
  const completedItems = items.filter(i => i.isCompleted);

  return (
    <div className="flex-1 overflow-y-auto safe-bottom">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Parking Lot
          </h2>
          <p className="text-sm text-muted-foreground">
            Park ideas, tasks, and thoughts here to deal with later.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Add New Item */}
            {isAdding ? (
              <div className="flex gap-2 mb-4">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="What's on your mind?"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                  className="flex-1"
                />
                <Button size="icon" variant="calm" onClick={handleAddItem}>
                  <Plus className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { setIsAdding(false); setNewItem(''); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full mb-4 border-dashed"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Park something
              </Button>
            )}

            {/* Empty State */}
            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Your parking lot is empty</p>
                <p className="text-xs">Capture ideas here so they don't distract you</p>
              </div>
            )}

            {/* Active Items */}
            {activeItems.length > 0 && (
              <div className="space-y-2 mb-4">
                {activeItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50"
                  >
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                    <span className="flex-1 text-sm text-foreground">{item.content}</span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Completed Items */}
            {completedItems.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Completed</p>
                <div className="space-y-2">
                  {completedItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/30"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="text-primary"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <span className="flex-1 text-sm text-muted-foreground line-through">{item.content}</span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
