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
          <p className="mt-2 text-sm text-muted-foreground">Effective Date: February 16, 2026</p>

          <div className="prose prose-sm mt-8 max-w-none text-foreground">
            <h2 className="text-xl font-semibold">Scope</h2>
            <p>
              This Privacy Policy applies to ZeroRetry extensions distributed through the Chrome Web Store,
              including ZeroRetry Index and Zero Distract. It does not apply to any other ZeroRetry products,
              services, or applications.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Local Processing</h2>
            <p>
              All processing performed by ZeroRetry extensions occurs locally in your browser.
              No data is transmitted to external servers.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Data Handling by Extension</h2>

            <h3 className="mt-4 text-lg font-semibold">ZeroRetry Index</h3>
            <p>
              The ZeroRetry Index extension does not collect, store, or transmit any of the following:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Location data</li>
              <li>Health and fitness data</li>
              <li>Financial or payment information</li>
              <li>Authentication credentials</li>
              <li>Personal identifiers</li>
              <li>Analytics or usage tracking</li>
              <li>Browsing history</li>
            </ul>

            <h3 className="mt-4 text-lg font-semibold">Zero Distract</h3>
            <p>
              The Zero Distract extension stores the following data locally in your browser
              using <code className="text-sm">chrome.storage.local</code>:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Domain names of configured distraction sites (e.g., youtube.com, reddit.com)</li>
              <li>Time spent on each tracked domain, bucketed by hour</li>
              <li>Focus mode settings, work hours, and nudge preferences</li>
              <li>User-created priority list items</li>
            </ul>
            <p className="mt-2">
              Zero Distract does <strong>not</strong> collect, store, or transmit:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Page content or full URLs beyond domain names</li>
              <li>User identity or account information</li>
              <li>Browsing history beyond configured distraction sites</li>
              <li>Any data to external servers</li>
            </ul>

            <h2 className="mt-6 text-xl font-semibold">Permissions</h2>
            <p>
              <strong>ZeroRetry Index:</strong> Permissions requested by the extension are used solely
              to provide local indexing functionality within your browser. No user data is collected
              or shared as a result of these permissions.
            </p>
            <p className="mt-2">
              <strong>Zero Distract:</strong> The extension requests the following permissions, all
              used exclusively for local functionality:
            </p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li><strong>storage</strong> — persist settings and time tracking data locally</li>
              <li><strong>alarms</strong> — schedule lightweight time tracking intervals and nudge timing</li>
              <li><strong>tabs</strong> — detect the active tab's domain for time tracking (domain name only)</li>
            </ul>
            <p className="mt-2">
              No user data is collected or shared as a result of these permissions.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Third-Party Services</h2>
            <p>
              The extensions do not integrate with third-party analytics, advertising, or tracking services.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted with an
              updated effective date.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Contact</h2>
            <p>
              For questions about this Privacy Policy, contact us at:{" "}
              <a href="mailto:mairh.utkarsh@gmail.com" className="text-primary underline">
                mairh.utkarsh@gmail.com
              </a>
            </p>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
