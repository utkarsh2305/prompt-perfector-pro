import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles } from "lucide-react";

export function PromptComparisonMock({ className }: { className?: string }) {
  return (
    <Card className={"pp-surface overflow-hidden rounded-xl border " + (className ?? "")}>
      <div className="border-b bg-[image:var(--gradient-brand)] p-4">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[image:var(--gradient-cta)] text-primary-foreground shadow-[var(--shadow-soft)]">
              <Sparkles className="h-4 w-4" />
            </span>
            Before → After
          </div>
          <div className="rounded-full bg-surface-accent px-2.5 py-1 text-xs font-medium text-surface-accent-foreground">
            55 principles
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <div className="rounded-lg border bg-background/60 p-3">
          <div className="text-xs font-medium text-muted-foreground">Before</div>
          <p className="mt-1 text-sm">
            “Write a marketing email for my product. Make it good.”
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-surface-accent px-2 py-1">Score: 4/10</span>
          <ArrowRight className="h-4 w-4" />
          <span className="rounded-full bg-surface-accent px-2 py-1">Score: 9/10</span>
        </div>

        <div className="rounded-lg border bg-background/60 p-3">
          <div className="text-xs font-medium text-muted-foreground">After</div>
          <p className="mt-1 text-sm">
            “Write a 120–160 word email announcing {`{product}`}. Audience: {`{persona}`}. Goal: {`{cta}`}. Include 3 benefits, one proof point, and a clear subject line.”
          </p>
        </div>
      </div>
    </Card>
  );
}
