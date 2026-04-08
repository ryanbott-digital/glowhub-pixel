import { Link } from "react-router-dom";
import { ArrowLeft, Shield, FileText } from "lucide-react";
import { GlowLogoImage } from "@/components/GlowHubLogo";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const LAST_UPDATED = "April 8, 2026";

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 mb-6 ${className}`}>
      {children}
    </div>
  );
}

function SummaryBox({ points }: { points: string[] }) {
  return (
    <div className="bg-cyan-500/5 backdrop-blur-xl border border-cyan-400/20 rounded-2xl p-6 mb-8">
      <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4" /> Summary for Humans
      </h3>
      <ul className="space-y-2">
        {points.map((p, i) => (
          <li key={i} className="text-[#E2E8F0] text-sm flex items-start gap-2">
            <span className="text-cyan-400 mt-0.5">•</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <GlassCard>
      <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
      <div className="text-[#E2E8F0] text-sm leading-relaxed space-y-3">{children}</div>
    </GlassCard>
  );
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#0B1120] font-['Satoshi',sans-serif] relative overflow-hidden">
      {/* Mesh gradient accents */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/home" className="flex items-center gap-2 text-[#E2E8F0] hover:text-cyan-400 transition-colors text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <GlowLogoImage className="h-8 w-auto" />
        </div>

        <p className="text-[#E2E8F0]/50 text-xs mb-6">Last Updated: {LAST_UPDATED}</p>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-8 flex items-center gap-3">
          <FileText className="h-8 w-8 text-cyan-400" />
          Legal
        </h1>

        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 mb-8 w-full sm:w-auto">
            <TabsTrigger value="terms" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              Terms of Service
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
              Privacy Policy
            </TabsTrigger>
          </TabsList>

          {/* ─── TERMS OF SERVICE ─── */}
          <TabsContent value="terms">
            <SummaryBox
              points={[
                "You pay $9/month for Pro — cancel anytime within 30 days for a full refund.",
                "You're responsible for what you upload. No pirated or illegal content.",
                "We aim for 99.9% uptime but can't control your Wi-Fi or hardware.",
              ]}
            />

            <SectionCard title="1. Your Subscription">
              <p>
                Glow Hub offers a <strong className="text-white">Pro</strong> subscription at <strong className="text-white">$9/month</strong>. 
                Your subscription auto-renews monthly. You can cancel at any time from your Settings page.
              </p>
              <p>
                If you cancel within <strong className="text-white">30 days</strong> of your first payment, 
                you're eligible for a full refund. After that, cancellations take effect at the end of the current billing cycle.
              </p>
              <p>
                Pro features (custom tickers, studio layouts, priority support) are only available while your subscription is active. 
                If your subscription lapses, your screens will revert to the free tier.
              </p>
            </SectionCard>

            <SectionCard title="2. Content Responsibility">
              <p>
                You are <strong className="text-white">100% responsible</strong> for all media you upload to Glow Hub. 
                This includes images, videos, text overlays, and any other content displayed on your screens.
              </p>
              <p>
                You must not upload content that is unlicensed, pirated, defamatory, obscene, or otherwise illegal in your jurisdiction. 
                We reserve the right to remove content and terminate accounts that violate this policy.
              </p>
              <p>
                You retain ownership of all content you upload. We do not claim any intellectual property rights over your media.
              </p>
            </SectionCard>

            <SectionCard title="3. Uptime & Reliability">
              <p>
                We strive for <strong className="text-white">99.9% uptime</strong> ("Glow Time") for our cloud services. 
                However, we cannot guarantee uninterrupted service.
              </p>
              <p>
                Glow Hub is <strong className="text-white">not liable</strong> for display interruptions caused by your local hardware, 
                internet connection, power outages, or third-party device firmware issues (e.g., Fire TV updates).
              </p>
              <p>
                Scheduled maintenance windows will be announced at least 48 hours in advance via email.
              </p>
            </SectionCard>

            <SectionCard title="4. Account Termination">
              <p>
                You may delete your account at any time from Settings. We'll purge your data within 30 days.
              </p>
              <p>
                We may suspend or terminate accounts that violate these terms, engage in abusive behavior, 
                or attempt to circumvent subscription restrictions. You'll receive an email notice before any action is taken.
              </p>
            </SectionCard>

            <SectionCard title="5. Changes to These Terms">
              <p>
                We may update these terms from time to time. Material changes will be communicated via email 
                or an in-app notification at least 14 days before taking effect.
              </p>
              <p>
                Continued use of Glow Hub after changes take effect constitutes acceptance of the updated terms.
              </p>
            </SectionCard>
          </TabsContent>

          {/* ─── PRIVACY POLICY ─── */}
          <TabsContent value="privacy">
            <SummaryBox
              points={[
                "We collect your email and usage data to run and improve the service.",
                "We never sell your personal data to third parties.",
                "You can request deletion of all your data at any time.",
              ]}
            />

            <SectionCard title="1. Data We Collect">
              <p>
                <strong className="text-white">Account data:</strong> Email address, hashed password, and profile information you provide at signup.
              </p>
              <p>
                <strong className="text-white">Usage data:</strong> Screen activity, playback logs, playlist configurations, and feature interactions. 
                This helps us improve the product and provide analytics features.
              </p>
              <p>
                <strong className="text-white">Lead capture:</strong> If you submit your email on our download page, 
                we store it with a timestamp and consent record to send you product updates and offers.
              </p>
            </SectionCard>

            <SectionCard title="2. How We Use Your Data">
              <p>We use your data to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Operate and maintain your Glow Hub account and screens</li>
                <li>Process subscription payments via Stripe</li>
                <li>Send transactional emails (password resets, billing receipts)</li>
                <li>Send marketing communications (only with your explicit consent)</li>
                <li>Generate anonymized, aggregated analytics to improve the platform</li>
              </ul>
            </SectionCard>

            <SectionCard title="3. Data Sharing">
              <p>
                We <strong className="text-white">never sell</strong> your personal data. We share data only with:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong className="text-white">Stripe</strong> — for payment processing</li>
                <li><strong className="text-white">Infrastructure providers</strong> — for hosting and CDN (data is encrypted in transit and at rest)</li>
              </ul>
            </SectionCard>

            <SectionCard title="4. Cookies & Local Storage">
              <p>
                We use essential cookies and local storage for authentication sessions and user preferences. 
                We do not use third-party tracking cookies.
              </p>
            </SectionCard>

            <SectionCard title="5. Data Retention & Deletion">
              <p>
                We retain your data for as long as your account is active. If you delete your account, 
                we'll remove all personal data within <strong className="text-white">30 days</strong>.
              </p>
              <p>
                Lead capture emails are retained until you unsubscribe. You can request deletion 
                by contacting us at any time.
              </p>
            </SectionCard>

            <SectionCard title="6. Your Rights">
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Access all personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent for marketing communications</li>
                <li>Export your data in a portable format</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, reach out via the contact form on our{" "}
                <Link to="/home" className="text-cyan-400 hover:text-cyan-300 underline transition-colors">
                  homepage
                </Link>.
              </p>
            </SectionCard>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-[#E2E8F0]/40 text-xs">
            © {new Date().getFullYear()} Glow Hub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
