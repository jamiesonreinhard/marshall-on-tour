import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Marshall",
  description: "Terms of Service for Marshall. Use of this website and content is subject to these terms.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-semibold text-zinc-900 tracking-tight">
              Marshall
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                Home
              </Link>
              <Link href="/blog" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                Blog
              </Link>
              <Link href="/about" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                About
              </Link>
              <Link href="/privacy" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-2 text-zinc-600">
              Last updated: February 2026
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-12">
        <div className="prose prose-zinc max-w-none space-y-8 text-zinc-700">
          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using the Marshall website and any content, features, or services offered on it (the &quot;Site&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree, please do not use the Site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">2. Use of the Site</h2>
            <p className="leading-relaxed">
              The Site provides editorial content about tennis, travel, gear, and related topics. You may use the Site for personal, non-commercial purposes. You may not copy, scrape, or redistribute content at scale; use the Site for any unlawful purpose; or attempt to interfere with the Site&apos;s operation or security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">3. Affiliate Links and Commerce</h2>
            <p className="leading-relaxed">
              Some links on the Site are affiliate links. If you click through and make a purchase, we may receive a commission at no extra cost to you. This helps support the Site. We only recommend products or services we believe are relevant to our audience. Affiliate relationships do not influence our editorial content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">4. Content and Accuracy</h2>
            <p className="leading-relaxed">
              Content on the Site is for general information and entertainment. We strive for accuracy but do not guarantee that all information is complete, current, or error-free. Tennis results, schedules, and other time-sensitive information may change. Use your own judgment and verify important details independently.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">5. Intellectual Property</h2>
            <p className="leading-relaxed">
              The Site and its content, including text, images, and design, are owned by Marshall (or its licensors) and are protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">6. Disclaimer of Warranties</h2>
            <p className="leading-relaxed">
              The Site is provided &quot;as is&quot; and &quot;as available.&quot; We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose. We do not warrant that the Site will be uninterrupted or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">7. Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the fullest extent permitted by law, Marshall and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising from your use of the Site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">8. Changes</h2>
            <p className="leading-relaxed">
              We may update these Terms from time to time. The &quot;Last updated&quot; date at the top will reflect the latest revision. Continued use of the Site after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">9. Contact</h2>
            <p className="leading-relaxed">
              For questions about these Terms, please see our <Link href="/about" className="text-zinc-900 underline hover:no-underline">About</Link> page or contact information provided there.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-200">
          <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
