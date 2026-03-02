import { useRef } from "react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { FloatingOrbs, Reveal } from "@/components/marketing/motion";
import { Card } from "@/components/ui/card";
import { useZrPageEffects } from "@/hooks/use-zr-page-effects";

export default function TermsOfService() {
  const pageRef = useRef<HTMLDivElement>(null);
  useZrPageEffects(pageRef);

  return (
    <div ref={pageRef} className="zr-page-shell zr-reduce-motion min-h-screen">
      <SiteHeader />
      <main className="relative pt-20">
        <section className="zr-section relative overflow-hidden">
          <FloatingOrbs />
          <div className="zr-content">
            <Reveal>
              <Card className="zr-panel mx-auto max-w-4xl p-6 sm:p-10" data-zr-tilt>
          <h1 className="text-3xl font-bold tracking-tight font-heading">Terms of Use</h1>
          <p className="mt-2 text-sm text-muted-foreground">Effective Date: February 16, 2026</p>

          <div className="zr-legal-content prose prose-sm mt-8 max-w-none text-foreground">
            <h2 className="text-xl font-semibold">Scope</h2>
            <p>
              These Terms of Use apply to ZeroRetry extensions distributed through the Chrome Web Store,
              including ZeroRetry Index and Zero Distract, and do not govern any other ZeroRetry products
              or services.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Acceptance</h2>
            <p>
              By installing and using any ZeroRetry extension, you agree to these Terms.
              If you do not agree, do not install or use the extensions.
            </p>

            <h2 className="mt-6 text-xl font-semibold">"As-Is" Disclaimer</h2>
            <p>
              The extensions are provided "as-is" without warranties of any kind, express or implied.
              We do not guarantee that the extensions will be error-free, uninterrupted, or meet your
              specific requirements.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Use the extensions for any unlawful purpose</li>
              <li>Attempt to reverse engineer, decompile, or disassemble the extensions</li>
              <li>Interfere with the operation of the extensions</li>
              <li>Redistribute or resell the extensions without authorization</li>
            </ul>

            <h2 className="mt-6 text-xl font-semibold">Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, ZeroRetry shall not be liable for any damages
              arising from your use of the extensions, including but not limited to direct, indirect,
              incidental, or consequential damages.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Changes to Terms</h2>
            <p>
              We may update these Terms at any time. Continued use of the extensions after changes
              constitutes acceptance of the updated Terms.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Contact</h2>
            <p>
              For questions about these Terms, contact us at:{" "}
              <a href="mailto:legal@zeroretry.com" className="text-primary underline">
                legal@zeroretry.com
              </a>
            </p>
          </div>
              </Card>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
