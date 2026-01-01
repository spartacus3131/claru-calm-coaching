import { useState } from 'react';
import { Plus, Trash2, CheckCircle, Circle, X, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ParkingItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export function ParkingLot() {
  const [items, setItems] = useState<ParkingItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    
    const item: ParkingItem = {
      id: Date.now().toString(),
      text: newItem.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    setItems(prev => [item, ...prev]);
    setNewItem('');
    setIsAdding(false);
  };

  const handleToggleItem = (id: string) => {
    setItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const activeItems = items.filter(i => !i.completed);
  const completedItems = items.filter(i => i.completed);

  return (
    <>
      {/* Floating Add Button */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-lg z-40"
            variant="calm"
          >
            <Inbox className="w-6 h-6" />
          </Button>
        </DrawerTrigger>
        
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-primary" />
              Parking Lot
            </DrawerTitle>
            <p className="text-sm text-muted-foreground text-left">
              Park ideas, tasks, and thoughts here to deal with later.
            </p>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
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
                      onClick={() => handleToggleItem(item.id)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                    <span className="flex-1 text-sm text-foreground">{item.text}</span>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
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
                        onClick={() => handleToggleItem(item.id)}
                        className="text-primary"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <span className="flex-1 text-sm text-muted-foreground line-through">{item.text}</span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
