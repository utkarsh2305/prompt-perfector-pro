import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Card } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container py-10 sm:py-14">
        <Card className="mx-auto max-w-3xl p-6 sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight font-heading">Privacy Policy</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: January 24, 2026</p>

          <div className="prose prose-sm mt-8 max-w-none text-foreground">
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p>
              Welcome to ZeroRetry ("we," "our," or "us"). We are committed to protecting your 
              personal information and your right to privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our service.
            </p>

            <h2 className="mt-6 text-xl font-semibold">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li><strong>Account Information:</strong> Email address, name, and password when you create an account.</li>
              <li><strong>Prompt Data:</strong> The prompts you submit for analysis. We store these to provide history and analytics.</li>
              <li><strong>Usage Data:</strong> Information about how you use our service, including analysis counts and feature usage.</li>
              <li><strong>Payment Information:</strong> If you subscribe to Pro, payment details are processed by Stripe (we don't store card numbers).</li>
            </ul>

            <h2 className="mt-6 text-xl font-semibold">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve user experience</li>
              <li>Protect against fraudulent or illegal activity</li>
            </ul>

            <h2 className="mt-6 text-xl font-semibold">4. Data Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li><strong>Service Providers:</strong> Third parties that help us operate our service (e.g., Supabase for database, Stripe for payments).</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
            </ul>

            <h2 className="mt-6 text-xl font-semibold">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal 
              information. However, no method of transmission over the Internet is 100% secure.
            </p>

            <h2 className="mt-6 text-xl font-semibold">6. Your Rights</h2>
            <p>Depending on your location, you may have rights to:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Data portability</li>
            </ul>

            <h2 className="mt-6 text-xl font-semibold">7. Cookies and Analytics</h2>
            <p>
              We use cookies and similar technologies to collect usage data. You can control cookies 
              through your browser settings. We use PostHog for analytics, which respects your 
              consent preferences.
            </p>

            <h2 className="mt-6 text-xl font-semibold">8. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed 
              to provide services. You can request deletion at any time by contacting us.
            </p>

            <h2 className="mt-6 text-xl font-semibold">9. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly collect 
              information from children under 13.
            </p>

            <h2 className="mt-6 text-xl font-semibold">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any 
              changes by posting the new policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="mt-6 text-xl font-semibold">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="mt-2">
              <a href="mailto:privacy@zeroretry.com" className="text-primary underline">
                privacy@zeroretry.com
              </a>
            </p>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
