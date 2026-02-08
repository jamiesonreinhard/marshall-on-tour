import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Marshall",
  description: "Privacy Policy for Marshall. How we collect, use, and protect your information.",
};

export default function PrivacyPage() {
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
              <Link href="/terms" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
              Privacy Policy
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
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">1. Introduction</h2>
            <p className="leading-relaxed">
              Marshall (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy Policy explains what information we collect when you use our website, how we use it, and your choices. By using the Site, you agree to this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">2. Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              We may collect the following when you use the Site:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-zinc-900">Usage data:</strong> Pages visited, time on site, referring URL, device and browser type, and general location (e.g., country or region) via standard web logs and analytics.</li>
              <li><strong className="text-zinc-900">Cookies and similar technologies:</strong> We use cookies and similar technologies to remember preferences and to understand how the Site is used.</li>
              <li><strong className="text-zinc-900">Analytics:</strong> We use third-party analytics (such as Mixpanel) to analyze traffic and improve the Site. These services may collect identifiers and usage data as described in their own privacy policies.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              We do not require you to create an account to read the blog. If you contact us or sign up for a newsletter in the future, we may collect the information you provide (e.g., email address).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">3. How We Use Information</h2>
            <p className="leading-relaxed">
              We use the information we collect to: operate and improve the Site; understand how visitors use the Site; troubleshoot issues; and, where applicable, send you updates or respond to inquiries. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">4. Affiliate Links and Third-Party Sites</h2>
            <p className="leading-relaxed">
              The Site contains links to third-party sites (e.g., retailers, booking sites). When you click an affiliate or other external link, you leave our Site and are subject to that third party&apos;s privacy policy and terms. We are not responsible for their practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">5. Data Retention and Security</h2>
            <p className="leading-relaxed">
              We retain usage and analytics data for as long as needed to operate the Site and for legitimate business purposes. We use reasonable measures to protect data, but no transmission over the internet is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">6. Your Choices</h2>
            <p className="leading-relaxed">
              You can control cookies through your browser settings. You may also be able to opt out of certain analytics. Disabling cookies may affect Site functionality. If we offer a newsletter or marketing emails, you can unsubscribe at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">7. Children</h2>
            <p className="leading-relaxed">
              The Site is not directed at children under 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">8. International Users</h2>
            <p className="leading-relaxed">
              The Site may be accessed from outside the United States. By using the Site, you consent to the transfer and processing of your information in the United States or other countries where we or our service providers operate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">9. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top reflects the latest version. Continued use of the Site after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mt-8 mb-4">10. Contact</h2>
            <p className="leading-relaxed">
              For privacy-related questions, please see our <Link href="/about" className="text-zinc-900 underline hover:no-underline">About</Link> page for contact information.
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
