import { useEffect, useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Trash2, CalendarCheck, Search } from "lucide-react";
import { aiErrorMessage } from "@/components/ai";

const SUGGESTIONS = [
  "What should I focus on right now?",
  "Help me break down a big task.",
  "I've been procrastinating — gently, please.",
  "Plan a realistic evening for me.",
];

export default function Coach() {
  const utils = trpc.useUtils();
  const historyQ = trpc.ai.coachHistory.useQuery();
  const chat = trpc.ai.coachChat.useMutation({
    onSuccess: () => utils.ai.coachHistory.invalidate(),
  });
  const weekly = trpc.ai.weeklyReview.useMutation();
  const ask = trpc.ai.ask.useMutation();
  const clear = trpc.ai.clearCoach.useMutation({
    onSuccess: () => utils.ai.coachHistory.invalidate(),
  });

  const [message, setMessage] = useState("");
  const [question, setQuestion] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [historyQ.data, chat.isPending]);

  const send = (text?: string) => {
    const m = (text ?? message).trim();
    if (!m || chat.isPending) return;
    setMessage("");
    chat.mutate({ message: m });
  };

  const messages = historyQ.data ?? [];

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl flex-col px-4 py-6 lg:h-[calc(100dvh-4rem)] lg:px-8">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow eyebrow-accent">AI Coach</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
            Someone in <em className="display-italic-accent">your corner.</em>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Kind, honest, never shaming. AI usage is billed to the site owner.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={weekly.isPending}
            onClick={() => weekly.mutate()}
          >
            <CalendarCheck className="mr-1.5 h-4 w-4" />
            {weekly.isPending ? "Reviewing…" : "Weekly reset"}
          </Button>
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={() => clear.mutate()} aria-label="Clear conversation">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {weekly.data && (
        <Card className="mb-4 max-h-56 overflow-y-auto border-[hsl(var(--brand))]/30 bg-[hsl(var(--brand-soft))] p-4">
          <p className="eyebrow mb-2 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Weekly reset</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{weekly.data.text}</p>
        </Card>
      )}
      {weekly.isError && <p className="mb-3 text-sm text-destructive">{aiErrorMessage(weekly.error.message)}</p>}

      {/* Chat */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 && !chat.isPending && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="font-display text-xl text-muted-foreground">
              How can I help you <em className="display-italic-accent">today?</em>
            </p>
            <div className="flex max-w-md flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="rounded-full border px-3.5 py-2 text-xs transition-colors hover:border-[hsl(var(--brand))] hover:text-brand"
                  onClick={() => send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-[hsl(var(--brand))] text-white"
                  : "rounded-bl-md border bg-card"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {chat.isPending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md border bg-card px-4 py-2.5 text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}
        {chat.isError && (
          <p className="text-center text-sm text-destructive">{aiErrorMessage(chat.error.message)}</p>
        )}
      </div>

      {/* Ask (AI search over your data) */}
      <Card className="mb-3 flex items-center gap-2 p-2">
        <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="Ask about your data — “when is my next exam?”"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && question.trim() && !ask.isPending) {
              ask.mutate({ question: question.trim() });
            }
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={!question.trim() || ask.isPending}
          onClick={() => ask.mutate({ question: question.trim() })}
        >
          {ask.isPending ? "…" : "Ask"}
        </Button>
      </Card>
      {ask.data && (
        <Card className="mb-3 max-h-40 overflow-y-auto p-3">
          <p className="whitespace-pre-wrap text-sm">{ask.data.text}</p>
        </Card>
      )}
      {ask.isError && <p className="mb-2 text-sm text-destructive">{aiErrorMessage(ask.error.message)}</p>}

      {/* Input */}
      <div className="flex items-end gap-2">
        <Textarea
          rows={1}
          className="max-h-32 min-h-[44px] flex-1 resize-none"
          placeholder="Talk to your coach…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button className="btn-brand h-11 w-11 shrink-0 p-0" disabled={!message.trim() || chat.isPending} onClick={() => send()} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
