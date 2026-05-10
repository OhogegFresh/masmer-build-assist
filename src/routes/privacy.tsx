import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout, LegalSection } from "@/components/masmer/LegalLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Masmer AI" },
      {
        name: "description",
        content:
          "How Masmer AI collects, uses, and protects your information.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" subtitle="Last updated: May 10, 2026">
      <LegalSection title="1. Information We Collect">
        <p>We collect information you provide directly:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>
            Name, email address, phone number, and business information when
            you request access or sign up
          </li>
          <li>Project and job information you enter while using the platform</li>
          <li>
            Call recordings and transcripts processed through our AI
            receptionist service
          </li>
          <li>Usage data and how you interact with our platform</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Provide, maintain, and improve Masmer AI</li>
          <li>Send you product updates, tips, and news (only with your consent)</li>
          <li>Process and generate estimates, contracts, and project documents</li>
          <li>Operate our AI receptionist and call logging features</li>
          <li>Send transactional emails related to your account</li>
          <li>Respond to your questions and support requests</li>
          <li>Comply with legal obligations</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Information Sharing">
        <p>We do not sell your personal information. We may share your information with:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Supabase (database and authentication)</li>
          <li>Resend (email delivery)</li>
          <li>Vapi (AI voice receptionist)</li>
          <li>Twilio (WhatsApp notifications)</li>
          <li>Anthropic (AI processing for estimates)</li>
          <li>Make.com (workflow automation)</li>
        </ul>
        <p>
          All third-party services are bound by their own privacy policies and
          data processing agreements.
        </p>
      </LegalSection>

      <LegalSection title="4. Call Recordings & Transcripts">
        <p>When you use our AI receptionist service:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Calls may be recorded and transcribed</li>
          <li>Transcripts are stored securely in your account dashboard</li>
          <li>You can delete call records at any time</li>
          <li>
            Callers are notified that calls may be recorded by the AI assistant
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Data Retention">
        <p>
          We retain your data for as long as your account is active. You can
          request deletion of your account and associated data at any time by
          emailing{" "}
          <a className="text-orange hover:underline" href="mailto:jacob@casacapsolutions.com">
            jacob@casacapsolutions.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Marketing Communications">
        <p>If you opted in to marketing communications:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>You can unsubscribe at any time</li>
          <li>Every email includes an unsubscribe link</li>
          <li>We will never sell your email to third parties</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>We implement industry-standard security measures:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>All data encrypted in transit (HTTPS/TLS)</li>
          <li>Database encryption at rest via Supabase</li>
          <li>Authentication handled by Supabase Auth</li>
          <li>Regular security reviews</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Your Rights">
        <p>You have the right to:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt out of marketing communications</li>
          <li>Data portability upon request</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Cookies">
        <p>We use essential cookies only:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Authentication session cookies</li>
          <li>No advertising or tracking cookies</li>
          <li>No third-party analytics cookies</li>
        </ul>
      </LegalSection>

      <LegalSection title="10. Contact Us">
        <p>For privacy questions or requests:</p>
        <p>
          Email:{" "}
          <a className="text-orange hover:underline" href="mailto:jacob@casacapsolutions.com">
            jacob@casacapsolutions.com
          </a>
          <br />
          Company: 607 The Home Improvement CCS Group
          <br />
          Operating as: Masmer AI
        </p>
      </LegalSection>
    </LegalLayout>
  );
}