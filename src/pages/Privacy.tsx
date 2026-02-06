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
          <p className="mt-2 text-sm text-muted-foreground">Effective Date: February 6, 2026</p>

          <div className="prose prose-sm mt-8 max-w-none text-foreground">
            <h2 className="text-xl font-semibold">Scope</h2>
            <p>
              This Privacy Policy applies exclusively to the ZeroRetry Index Chrome Extension. 
              It does not apply to any other ZeroRetry products or services.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Local Processing</h2>
            <p>
              All processing performed by the ZeroRetry Index extension occurs locally in your browser. 
              No data is transmitted to external servers.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Data Collection</h2>
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

            <h2 className="mt-6 text-xl font-semibold">Permissions</h2>
            <p>
              Any permissions requested by the extension are used solely to provide local functionality 
              within your browser. No user data is collected or shared as a result of these permissions.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Third-Party Services</h2>
            <p>
              The extension does not integrate with third-party analytics, advertising, or tracking services.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted with an 
              updated effective date.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Contact</h2>
            <p>
              For questions about this Privacy Policy, contact us at:{" "}
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
