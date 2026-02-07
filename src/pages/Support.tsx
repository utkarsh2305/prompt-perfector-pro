import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function Support() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container py-10 sm:py-14">
        <Card className="mx-auto max-w-3xl p-6 sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight font-heading">Support</h1>
          <p className="mt-2 text-sm text-muted-foreground">We're here to help</p>

          <div className="prose prose-sm mt-8 max-w-none text-foreground">
            <h2 className="text-xl font-semibold">Get in Touch</h2>
            <p>
              We value your feedback and are committed to providing the best experience with ZeroRetry Index. 
              Whether you need technical support, have questions about features, or want to share suggestions 
              for improvement, we'd love to hear from you.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Contact Our Team</h2>
            <p>
              For support requests, feature suggestions, bug reports, or general inquiries, please reach out to us:
            </p>
            
            <div className="mt-4 not-prose">
              <a 
                href="mailto:mairh.utkarsh@gmail.com"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span className="font-medium">mairh.utkarsh@gmail.com</span>
              </a>
            </div>

            <h2 className="mt-8 text-xl font-semibold">Response Time</h2>
            <p>
              We typically respond to all inquiries within 24-48 hours during business days. 
              For urgent issues, please mention "URGENT" in your email subject line.
            </p>

            <h2 className="mt-6 text-xl font-semibold">What to Include</h2>
            <p>To help us assist you more effectively, please include:</p>
            <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>A clear description of your issue or suggestion</li>
              <li>Your browser version and operating system (if reporting a bug)</li>
              <li>Steps to reproduce the issue (if applicable)</li>
              <li>Screenshots or error messages (if relevant)</li>
            </ul>

            <h2 className="mt-6 text-xl font-semibold">Feature Requests</h2>
            <p>
              We actively incorporate user feedback into our development roadmap. If you have ideas for 
              new features or improvements, we encourage you to share them. Your input helps shape the 
              future of ZeroRetry Index.
            </p>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
