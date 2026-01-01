export function TypingIndicator() {
  return (
    <div className="flex items-start animate-fade-in">
      <div className="bubble-assistant px-4 py-3">
        <div className="flex gap-1.5">
          <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
          <span className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
        </div>
      </div>
    </div>
  );
}
