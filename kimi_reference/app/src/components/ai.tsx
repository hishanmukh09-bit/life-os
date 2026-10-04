import { Sparkles } from "lucide-react";

/** Maps server AI error codes to human copy (degradation UI, never a stack trace). */
export function aiErrorMessage(message: string): string {
  if (message.includes("AI_UNAVAILABLE"))
    return "AI is temporarily unavailable (quota may be exhausted). Everything else in the app still works.";
  if (message.includes("AI_TRANSIENT"))
    return "The AI service is briefly busy. Try again in a moment.";
  if (message.includes("AI_ERROR"))
    return "AI service temporarily unavailable. Try again later.";
  return message || "Something went wrong. Try again.";
}

export function AIErrorText({ code }: { code: string }) {
  return <p className="text-sm text-muted-foreground">{aiErrorMessage(code)}</p>;
}

/** Wrap an AI tRPC mutation hook. */
export function useAiAction<T>(useMutationHook: () => T): T {
  return useMutationHook();
}

export function AiThinking({ label = "Thinking…" }: { label?: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Sparkles className="h-4 w-4 animate-pulse text-brand" />
      {label}
    </p>
  );
}
