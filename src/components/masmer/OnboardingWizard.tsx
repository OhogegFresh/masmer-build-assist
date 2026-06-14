import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Hammer, ShoppingCart, ClipboardList, PhoneCall, Phone, ArrowRight, X } from "lucide-react";
import { VAPI_PHONE_DISPLAY, VAPI_PHONE_TEL, VAPI_PHONE_FULL } from "./VapiCard";

const STORAGE_KEY = "masmer_onboarding_done";

export function hasCompletedOnboarding() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function markOnboardingDone() {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
}

export function OnboardingWizard({
  inviteeName,
  onClose,
}: {
  inviteeName: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  function close() {
    markOnboardingDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl my-8">
        <button
          onClick={close}
          className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 md:px-8 py-2 pt-6">
          <div className="flex gap-1.5 mb-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1 flex-1 rounded-full ${n <= step ? "bg-orange" : "bg-secondary"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div>
              <h2 className="font-display text-3xl font-bold">
                Welcome to Masmer 👋
              </h2>
              <p className="mt-2 text-muted-foreground">
                Hi {inviteeName}! Masmer is your complete AI command center for running a contracting business.
                Let's take a quick tour so you know what's possible.
              </p>
              <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Here's what you can do:
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { icon: Hammer, label: "Scope of Work" },
                  { icon: ShoppingCart, label: "Materials Estimator" },
                  { icon: ClipboardList, label: "Crew Punchlist" },
                  { icon: PhoneCall, label: "AI Receptionist" },
                ].map((f) => (
                  <div key={f.label} className="rounded-lg border border-border p-3 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-md bg-orange/15 text-orange flex items-center justify-center shrink-0">
                      <f.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{f.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 mb-6 flex justify-end">
                <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 rounded-md bg-gradient-orange px-5 py-2.5 text-sm font-bold text-white">
                  Let's go <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-3xl font-bold">Try the AI Receptionist 📞</h2>
              <p className="mt-2 text-muted-foreground">
                Call this number right now to hear your AI receptionist in action.
              </p>
              <a
                href={`tel:${VAPI_PHONE_TEL}`}
                className="mt-5 block rounded-xl border-2 border-orange bg-orange/10 p-5 text-center hover:bg-orange/15"
              >
                <div className="text-xs uppercase tracking-wider text-orange/80 font-semibold flex items-center justify-center gap-1.5">
                  <Phone className="h-3 w-3" /> Tap to call
                </div>
                <div className="font-display text-3xl md:text-4xl font-bold text-orange mt-1">
                  {VAPI_PHONE_FULL}
                </div>
              </a>
              <div className="mt-5 rounded-lg border border-border bg-secondary/30 p-4 text-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Sample transcript
                </p>
                <p className="text-muted-foreground italic">
                  <span className="text-orange not-italic font-semibold">AI:</span> Thanks for calling Masmer Construction, this is Maya. How can I help you today?<br/>
                  <span className="text-foreground not-italic font-semibold">Caller:</span> Hi, I need a quote for a kitchen remodel.<br/>
                  <span className="text-orange not-italic font-semibold">AI:</span> Great — what's the address and your ideal timeline?...
                </p>
              </div>
              <div className="mt-8 mb-6 flex justify-between">
                <button onClick={() => setStep(3)} className="text-sm text-muted-foreground hover:text-foreground">
                  Skip for now →
                </button>
                <button onClick={() => setStep(3)} className="inline-flex items-center gap-2 rounded-md bg-gradient-orange px-5 py-2.5 text-sm font-bold text-white">
                  I called it! Show me the app <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display text-3xl font-bold">Build your first Scope of Work 🔧</h2>
              <p className="mt-2 text-muted-foreground">
                Click below to try Eliko — it builds full scopes, material lists, and punchlists in minutes.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => { close(); navigate({ to: "/estimate" }); }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-orange px-6 py-4 text-lg font-bold text-white shadow-orange hover:scale-[1.01] transition-transform"
                >
                  Try Eliko <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={close}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:border-orange hover:text-orange"
                >
                  Go to Dashboard →
                </button>
              </div>
              <div className="mb-6" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
