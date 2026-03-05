import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | YoursTruly',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FDF8F3] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[#406A56] hover:underline text-sm mb-8 inline-block">
          &larr; Back to home
        </Link>

        <h1 className="text-3xl font-bold text-[#2d2d2d] mb-2 font-playfair">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 5, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-[#2d2d2d]/80 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using YoursTruly (&quot;the Service&quot;), operated by YoursTruly LLC,
              you agree to be bound by these Terms of Service. If you do not agree to these terms,
              please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">2. Description of Service</h2>
            <p>
              YoursTruly is a relationship memory platform that allows users to capture, preserve,
              and share personal memories, stories, photos, and voice recordings. The Service includes
              AI-powered features, marketplace integrations, and subscription plans.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">3. User Accounts</h2>
            <p>
              You must be at least 13 years old to create an account. You are responsible for
              maintaining the security of your account credentials and for all activity under your
              account. You agree to provide accurate, current, and complete information during
              registration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">4. User Content</h2>
            <p>
              You retain ownership of all content you upload to YoursTruly, including photos, text,
              voice recordings, and other materials (&quot;User Content&quot;). By uploading content,
              you grant us a limited license to store, process, and display your content solely for
              the purpose of providing the Service to you.
            </p>
            <p className="mt-2">
              You are solely responsible for the content you upload. You must not upload content
              that violates any applicable law, infringes on intellectual property rights, or
              contains harmful or abusive material.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">5. Subscriptions and Payments</h2>
            <p>
              Some features require a paid subscription. Subscription fees are billed in advance
              on a monthly or yearly basis. You may cancel your subscription at any time, and
              cancellation will take effect at the end of the current billing period. Refunds
              are handled in accordance with our refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">6. AI Features</h2>
            <p>
              The Service uses artificial intelligence to enhance your experience, including
              generating prompts, analyzing photos, and facilitating conversations. AI-generated
              content is provided as-is and may not always be accurate. You should review any
              AI-generated content before relying on it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">7. Marketplace</h2>
            <p>
              Products available through our marketplace are fulfilled by third-party partners.
              We are not responsible for the quality, shipping, or delivery of third-party products.
              All marketplace purchases are subject to the respective partner&apos;s terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these terms.
              Upon termination, you may request an export of your data within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">9. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. To the
              maximum extent permitted by law, YoursTruly LLC shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">10. Changes to Terms</h2>
            <p>
              We may update these terms from time to time. We will notify you of material changes
              via email or through the Service. Continued use of the Service after changes
              constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">11. Contact</h2>
            <p>
              For questions about these terms, contact us at{' '}
              <a href="mailto:support@yourstruly.love" className="text-[#406A56] hover:underline">
                support@yourstruly.love
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
