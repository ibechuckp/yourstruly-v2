import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | YoursTruly',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FDF8F3] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-[#406A56] hover:underline text-sm mb-8 inline-block">
          &larr; Back to home
        </Link>

        <h1 className="text-3xl font-bold text-[#2d2d2d] mb-2 font-playfair">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: March 5, 2026</p>

        <div className="prose prose-gray max-w-none space-y-6 text-[#2d2d2d]/80 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">1. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Account information:</strong> name, email address, and password when you register.</li>
              <li><strong>Profile information:</strong> interests, hobbies, location, and other details you provide during onboarding.</li>
              <li><strong>User content:</strong> photos, memories, voice recordings, and stories you upload.</li>
              <li><strong>Usage data:</strong> how you interact with the Service, including pages visited and features used.</li>
              <li><strong>Payment information:</strong> processed securely through Stripe. We do not store your full card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve the Service.</li>
              <li>Personalize your experience, including AI-powered features.</li>
              <li>Process payments and manage subscriptions.</li>
              <li>Send important notifications about your account or the Service.</li>
              <li>Ensure the security and integrity of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">3. AI Processing</h2>
            <p>
              We use AI services (including Anthropic Claude, Google Gemini, and OpenAI) to power
              features like memory prompts, photo analysis, and conversational experiences. Your
              content may be sent to these providers for processing. We do not use your personal
              content to train AI models. Each provider&apos;s data handling is governed by their
              respective privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">4. Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase (PostgreSQL database and cloud storage)
              and AWS infrastructure. We use encryption in transit (TLS) and at rest. While we
              implement industry-standard security measures, no method of transmission or storage
              is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">5. Data Sharing</h2>
            <p>We do not sell your personal information. We share data only with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Service providers:</strong> Stripe (payments), Resend (email), Telnyx (SMS), and AI providers as needed to operate the Service.</li>
              <li><strong>Marketplace partners:</strong> Only the information necessary to fulfill orders you place (e.g., shipping address).</li>
              <li><strong>Legal requirements:</strong> When required by law, subpoena, or court order.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Access</strong> your personal data stored in the Service.</li>
              <li><strong>Export</strong> your data at any time from your account settings.</li>
              <li><strong>Delete</strong> your account and associated data.</li>
              <li><strong>Correct</strong> inaccurate information in your profile.</li>
              <li><strong>Opt out</strong> of non-essential communications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">7. Cookies</h2>
            <p>
              We use essential cookies to maintain your session and preferences. We do not use
              third-party tracking cookies for advertising purposes. You can manage cookie
              preferences through our cookie consent banner.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">8. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for children under 13. We do not knowingly collect
              personal information from children under 13. If you believe a child has provided
              us with personal data, please contact us for removal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes via email or through the Service. The date at the top of this page indicates
              when it was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2d2d2d] mt-8 mb-3">10. Contact Us</h2>
            <p>
              For privacy-related questions or to exercise your data rights, contact us at{' '}
              <a href="mailto:privacy@yourstruly.love" className="text-[#406A56] hover:underline">
                privacy@yourstruly.love
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
