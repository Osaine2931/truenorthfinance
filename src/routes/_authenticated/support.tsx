import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({ meta: [{ title: "Support — TrueNorth Financial" }] }),
  component: Support,
});

function Support() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Support</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Our team of advisors is available 24/7 to help.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Mail, title: "Email", value: "support@aurelian.example" },
          { icon: MessageCircle, title: "Live chat", value: "Available now" },
          { icon: LifeBuoy, title: "Help center", value: "Browse articles" },
        ].map((c) => (
          <div key={c.title} className="surface-card p-5">
            <div className="grid size-9 place-items-center rounded-md bg-royal-soft text-royal">
              <c.icon className="size-4" />
            </div>
            <p className="mt-3 font-medium text-foreground">{c.title}</p>
            <p className="text-sm text-muted-foreground">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
