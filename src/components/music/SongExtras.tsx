import { Lock, Unlock, StickyNote } from "lucide-react";

interface Props { remarks?: string | null; listenSeconds?: number; isAdmin?: boolean; duration?: number }

export const SongExtras = ({ remarks, listenSeconds = 0, isAdmin = false, duration = 0 }: Props) => {
  const threshold = duration > 0 && duration < 60 ? 30 : 60;
  const unlocked = isAdmin || listenSeconds >= threshold;
  const remaining = Math.max(0, threshold - Math.floor(listenSeconds));

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest text-muted-foreground">
        <StickyNote className="h-3.5 w-3.5 text-primary" /> Private Note
      </div>
      {!remarks ? (
        <p className="text-xs text-muted-foreground italic">No private note for this song.</p>
      ) : unlocked ? (
        <div className="rounded-sm border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary mb-3">
            <Unlock className="h-3 w-3" /> Unlocked
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{remarks}</p>
        </div>
      ) : (
        <div className="rounded-sm border border-border bg-popover/30 p-4">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            <Lock className="h-3 w-3" /> Sealed
          </div>
          <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
            <Lock className="h-3 w-3 shrink-0" />
            A private note waits. Keep listening — unlocks in {remaining}s.
          </p>
        </div>
      )}
    </div>
  );
};
