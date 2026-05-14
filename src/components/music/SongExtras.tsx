import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Lock, Unlock, ScrollText, Plus } from "lucide-react";
import { toast } from "sonner";

interface Props { songId: string; songTitle?: string; listenSeconds?: number }

const UNLOCK_AFTER = 30;

interface Letter { id: string; author_id: string; title: string | null; body: string; unlocked: boolean; created_at: string }

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

export const SongExtras = ({ songId, songTitle = "", listenSeconds = 0 }: Props) => {
  const { user, isAdmin } = useAuth();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [showLetterForm, setShowLetterForm] = useState(false);
  const [lTitle, setLTitle] = useState("");
  const [lBody, setLBody] = useState("");

  const unlockedByListen = listenSeconds >= UNLOCK_AFTER;
  const remaining = Math.max(0, UNLOCK_AFTER - Math.floor(listenSeconds));

  const load = async () => {
    const { data } = await supabase
      .from("song_letters")
      .select("*")
      .eq("song_id", songId)
      .order("created_at", { ascending: false });
    setLetters((data as any) ?? []);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [songId]);

  // Persist unlock once listener crosses 30s threshold
  useEffect(() => {
    if (!unlockedByListen || !user || isAdmin) return;
    const toUnlock = letters.filter((l) => !l.unlocked);
    if (!toUnlock.length) return;
    (async () => {
      await supabase
        .from("song_letters")
        .update({ unlocked: true, unlocked_at: new Date().toISOString() })
        .in("id", toUnlock.map((l) => l.id));
      setLetters((prev) => prev.map((l) => toUnlock.find((u) => u.id === l.id) ? { ...l, unlocked: true } : l));
    })();
  }, [unlockedByListen, letters, user, isAdmin]);

  const sendNotification = async () => {
    if (!user) return;
    const [{ data: recipients }, { data: sender }] = await Promise.all([
      supabase.from("profiles").select("id").neq("id", user.id),
      supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
    ]);
    if (!recipients?.length) return;
    const senderName = (sender as any)?.name ?? "Someone";
    const rows = recipients.map((r: any) => ({
      recipient_id: r.id,
      sender_id: user.id,
      type: "letter",
      song_id: songId,
      song_title: songTitle,
      sender_name: senderName,
    }));
    const { error } = await supabase.from("notifications").insert(rows);
    if (error) console.error("notification insert failed:", error.message);
  };

  const saveLetter = async () => {
    if (!user || !lBody.trim()) return;
    const { error } = await supabase.from("song_letters").insert({ song_id: songId, author_id: user.id, title: lTitle || null, body: lBody });
    if (error) { toast.error(error.message); return; }
    setLTitle(""); setLBody(""); setShowLetterForm(false);
    toast.success("Letter sealed 💌");
    await sendNotification();
    load();
  };

  const deleteLetter = async (id: string) => {
    await supabase.from("song_letters").delete().eq("id", id);
    load();
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <ScrollText className="h-3.5 w-3.5 text-primary" /> Letters
        </div>
        {isAdmin && (
          <Button size="sm" variant="ghost" onClick={() => setShowLetterForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Write
          </Button>
        )}
      </div>
      {isAdmin && showLetterForm && (
        <div className="space-y-2 mb-4 p-3 rounded-sm border border-primary/30 bg-primary/5">
          <Input placeholder="Title (optional)" value={lTitle} onChange={(e) => setLTitle(e.target.value)} maxLength={120} />
          <Textarea placeholder="A long letter, sealed until they play this song…" value={lBody} onChange={(e) => setLBody(e.target.value)} rows={5} maxLength={4000} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowLetterForm(false)}>Cancel</Button>
            <Button size="sm" onClick={saveLetter} disabled={!lBody.trim()}>Seal</Button>
          </div>
        </div>
      )}
      {letters.length === 0 && !showLetterForm && (
        <p className="text-xs text-muted-foreground italic">No letters tied to this song yet.</p>
      )}
      <div className="space-y-3">
        {letters.map((l) => {
          const visible = isAdmin || l.unlocked || unlockedByListen;
          return (
            <div key={l.id} className="rounded-sm border border-border p-3 bg-popover/30">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-[10px] text-muted-foreground">{fmtDate(l.created_at)}</span>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {visible ? <Unlock className="h-3 w-3 text-primary" /> : <Lock className="h-3 w-3" />}
                  {isAdmin ? "You wrote" : visible ? "Unlocked" : "Sealed"}
                </div>
                {isAdmin && (
                  <button onClick={() => deleteLetter(l.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              {l.title && <div className="text-sm font-medium mb-1">{l.title}</div>}
              {visible ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{l.body}</p>
              ) : (
                <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> A letter waits. Unlocks after {remaining}s of listening.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
