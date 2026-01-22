import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Card } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container py-10 sm:py-14">
        <Card className="mx-auto max-w-3xl p-6 sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: January 22, 2026</p>

          <div className="prose prose-sm mt-8 max-w-none text-foreground">
            <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
            <p>
              By accessing or using Prompt Perfector ("Service"), you agree to be bound by these 
              Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>

            <h2 className="mt-6 text-xl font-semibold">2. Description of Service</h2>
            <p>
              Prompt Perfector is a tool that analyzes AI prompts and provides suggestions for 
              improvement. The Service is provided on a freemium basis, with additional features 
              available through paid subscriptions.
            </p>

            <h2 className="mt-6 text-xl font-semibold">3. User Accounts</h2>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must notify us immediately of any unauthorized access to your account.</li>
              <li>You may not share your account with others or transfer your account.</li>
            </ul>

            <h2 className="mt-6 text-xl font-semibold">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Submit content that is illegal, harmful, threatening, or otherwise objectionable</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use automated systems to access the Service beyond intended use</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>

            <h2 className="mt-6 text-xl font-semibold">5. Subscription and Payments</h2>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>Paid subscriptions are billed on a recurring basis (monthly or annually).</li>
              <li>You authorize us to charge your payment method for subscription fees.</li>
              <li>Subscriptions automatically renew unless canceled before the renewal date.</li>
              <li>Refunds are provided at our discretion, typically within 7 days of purchase.</li>
              <li>We reserve the right to change pricing with 30 days notice.</li>
            </ul>

            <h2 className="mt-6 text-xl font-semibold">6. Free Tier Limitations</h2>
            <p>
              Free tier users are limited to 10 prompt analyses per day. We reserve the right 
              to modify these limits at any time.
            </p>

            <h2 className="mt-6 text-xl font-semibold">7. Intellectual Property</h2>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>The Service and its original content are owned by Prompt Perfector.</li>
              <li>You retain ownership of the prompts you submit.</li>
              <li>By using the Service, you grant us a license to process your prompts for analysis.</li>
              <li>We do not claim ownership of your improved prompts.</li>
            </ul>

            <h2 className="mt-6 text-xl font-semibold">8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 
              WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>

            <h2 className="mt-6 text-xl font-semibold">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROMPT PERFECTOR SHALL NOT BE LIABLE FOR 
              ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT 
              OF OR RELATED TO YOUR USE OF THE SERVICE.
            </p>

            <h2 className="mt-6 text-xl font-semibold">10. Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violation of these Terms. 
              Upon termination, your right to use the Service will immediately cease.
            </p>

            <h2 className="mt-6 text-xl font-semibold">11. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of 
              material changes. Continued use of the Service after changes constitutes acceptance.
            </p>

            <h2 className="mt-6 text-xl font-semibold">12. Governing Law</h2>
            <p>
              These Terms shall be governed by the laws of the jurisdiction in which Prompt 
              Perfector operates, without regard to conflict of law principles.
            </p>

            <h2 className="mt-6 text-xl font-semibold">13. Contact</h2>
            <p>
              For questions about these Terms, please contact us at:
            </p>
            <p className="mt-2">
              <a href="mailto:legal@promptperfector.com" className="text-primary underline">
                legal@promptperfector.com
              </a>
            </p>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
