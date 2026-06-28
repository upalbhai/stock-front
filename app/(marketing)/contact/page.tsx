import Link from "next/link";
import { ArrowRight, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_ROUTES } from "@/lib/routes";

const contactCards = [
  { title: "Email", text: "hello@outletpulse.in", icon: Mail },
  { title: "Phone", text: "+91 90000 00000", icon: Phone },
  { title: "Location", text: "Built for retail teams in India", icon: MapPin },
];

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary">Contact</p>
          <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Talk to us about your outlet workflow.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Share what you need across billing, inventory, GST invoices, customer credit, staff access, and reports.
          </p>
          <Button asChild className="mt-7 rounded-[8px]">
            <Link href={APP_ROUTES.LOGIN}>
              Login to continue <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {contactCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center gap-4 rounded-[8px] border border-border bg-card p-5 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-heading text-lg font-bold">{item.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
                </div>
              </div>
            );
          })}

          <div className="rounded-[8px] border border-border bg-muted/30 p-5">
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-1 h-5 w-5 text-warning" />
              <div>
                <h2 className="font-heading text-lg font-bold">Need onboarding?</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  We can help map your outlets, staff access, products, units, GST settings, and billing flow before launch.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
