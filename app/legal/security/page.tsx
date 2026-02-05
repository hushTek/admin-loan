import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/app/_components/landing-sections";
import { ShieldCheck, Lock, Server, Eye } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Security</h1>
        
        <div className="prose dark:prose-invert max-w-none space-y-8">
          <p className="text-lg text-muted-foreground">
            At Trust Funding Microfinance (TFM), protecting your financial data and personal information is our top priority. 
            We employ bank-grade security measures to ensure your experience is safe and secure.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="p-6 border rounded-xl bg-card">
              <Lock className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Data Encryption</h3>
              <p className="text-sm text-muted-foreground">
                All data transmitted between your browser and our servers is encrypted using 256-bit SSL/TLS encryption. 
                Your sensitive information is encrypted at rest in our databases.
              </p>
            </div>
            
            <div className="p-6 border rounded-xl bg-card">
              <Server className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Secure Infrastructure</h3>
              <p className="text-sm text-muted-foreground">
                Our servers are hosted in secure, SOC 2 compliant data centers with 24/7 monitoring, biometric access controls, and redundant power systems.
              </p>
            </div>

            <div className="p-6 border rounded-xl bg-card">
              <ShieldCheck className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Identity Verification</h3>
              <p className="text-sm text-muted-foreground">
                We use multi-factor authentication (MFA) and advanced identity verification protocols to prevent fraud and ensure only you can access your account.
              </p>
            </div>

            <div className="p-6 border rounded-xl bg-card">
              <Eye className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">Fraud Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Our automated systems monitor transactions 24/7 for suspicious activity. We immediately flag and investigate any unusual behavior to protect your funds.
              </p>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-3">Compliance & Legal</h2>
            <p>
              We adhere to all relevant financial regulations in Tanzania.
            </p>
            <p className="mt-2">
              <strong>Currency Handling:</strong> While we display images of Tanzanian currency for illustrative purposes, we do not print or reproduce currency. 
              All digital representations on this site are marked as "SPECIMEN" and follow the Bank of Tanzania's guidelines to prevent counterfeiting and misuse. 
              Source of currency images: <a href="https://www.bot.go.tz/Currency/BanknotesAndCoinsIssued" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bank of Tanzania</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Reporting a Vulnerability</h2>
            <p>
              If you believe you have found a security vulnerability in our application, please contact our security team immediately at security@chapchap.co.tz. 
              We operate a responsible disclosure program and appreciate your help in keeping our platform safe.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
