import { Button } from '@/components/ui/button';

interface QuickRepliesProps {
  replies: string[];
  onSelect: (reply: string) => void;
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap gap-2 animate-fade-in">
      {replies.map((reply) => (
        <Button
          key={reply}
          variant="chip"
          onClick={() => onSelect(reply)}
        >
          {reply}
        </Button>
      ))}
    </div>
  );
}
