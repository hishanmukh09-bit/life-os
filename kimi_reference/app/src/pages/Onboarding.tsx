import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Create-or-join flow for the two-person private space. */
export default function Onboarding() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { data: space, isLoading } = trpc.space.get.useQuery();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const createSpace = trpc.space.create.useMutation({
    onSuccess: async () => {
      await utils.space.get.invalidate();
      toast.success("Your space is ready.");
    },
    onError: (e) => toast.error(e.message),
  });
  const joinSpace = trpc.space.join.useMutation({
    onSuccess: async () => {
      await utils.space.get.invalidate();
      navigate("/home");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-[hsl(var(--brand))]" />
      </div>
    );
  }

  // Already has a space: show invite code until partner joins.
  if (space) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <p className="eyebrow-accent">Step 2 of 2</p>
          <h1 className="font-display mt-3 text-4xl font-medium leading-tight">
            Invite your <em className="display-italic-accent">person</em>.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Share this code with the one person who'll share this space. Once
            they join, the space closes — it's only ever the two of you.
          </p>
          <div className="mt-8 rounded-2xl border border-border bg-card p-6">
            <p className="eyebrow mb-2">Invite code</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 rounded-xl bg-secondary px-4 py-3 text-center font-mono text-lg tracking-widest">
                {space.space.inviteCode}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl"
                aria-label="Copy invite code"
                onClick={() => {
                  navigator.clipboard.writeText(space.space.inviteCode).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <Check className="h-4 w-4 text-[hsl(var(--success))]" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {space.memberCount === 2
                ? "Your partner has joined."
                : "Waiting for your partner to join…"}
            </p>
          </div>
          <Button
            className="btn-brand mt-6 h-12 w-full rounded-full"
            onClick={() => navigate("/home")}
          >
            {space.memberCount === 2 ? "Open your space" : "Continue to your space"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <p className="eyebrow-accent">Step 1 of 2</p>
        <h1 className="font-display mt-3 text-4xl font-medium leading-tight">
          Your <em className="display-italic-accent">private space</em> for two.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Create a new space and invite your person — or join theirs with a
          code.
        </p>

        <div className="mt-8 grid gap-3">
          <button
            onClick={() => setMode("create")}
            className={cn(
              "rounded-2xl border p-5 text-left transition-all min-h-[72px]",
              mode === "create"
                ? "border-[hsl(var(--brand))] bg-brand-soft/60"
                : "border-border bg-card card-lift",
            )}
          >
            <p className="font-display text-lg font-medium">Create a space</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              You'll get an invite code to share.
            </p>
          </button>
          <button
            onClick={() => setMode("join")}
            className={cn(
              "rounded-2xl border p-5 text-left transition-all min-h-[72px]",
              mode === "join"
                ? "border-[hsl(var(--brand))] bg-brand-soft/60"
                : "border-border bg-card card-lift",
            )}
          >
            <p className="font-display text-lg font-medium">Join with a code</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Your person already created a space.
            </p>
          </button>
        </div>

        {mode === "create" && (
          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              createSpace.mutate({ name: name.trim() || undefined });
            }}
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your space (optional)"
              className="h-12 rounded-xl"
              maxLength={120}
            />
            <Button
              type="submit"
              disabled={createSpace.isPending}
              className="btn-brand h-12 w-full rounded-full"
            >
              {createSpace.isPending ? "Creating…" : "Create space"}
            </Button>
          </form>
        )}

        {mode === "join" && (
          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim().length >= 4) joinSpace.mutate({ inviteCode: code.trim() });
            }}
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter invite code"
              className="h-12 rounded-xl font-mono tracking-widest"
              maxLength={16}
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={joinSpace.isPending || code.trim().length < 4}
              className="btn-brand h-12 w-full rounded-full"
            >
              {joinSpace.isPending ? "Joining…" : "Join space"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
