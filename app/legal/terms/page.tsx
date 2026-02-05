import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/app/_components/landing-sections";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p className="text-sm text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using the services provided by Trust Funding Microfinance ("TFM", "we", "us"), you agree to be bound by these Terms of Service. 
              If you disagree with any part of the terms, then you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Loan Services</h2>
            <p>
              Our platform provides an interface for applying for microfinance loans. All loan applications are subject to approval based on our credit policies. 
              We reserve the right to approve or decline any application at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate, current, and complete information during the application process.</li>
              <li>Maintain the security of your account credentials.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
              <li>Use the services only for lawful purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Intellectual Property & Currency Usage</h2>
            <p>
              The content, organization, graphics, design, compilation, and other matters related to the Site are protected under applicable copyrights and other proprietary (including but not limited to intellectual property) rights.
            </p>
            <p className="mt-2">
              <strong>Currency Images:</strong> Images of Tanzanian banknotes displayed on this site are used for illustrative purposes only and are not legal tender. 
              These images are reproductions and are marked as "SPECIMEN" to comply with legal requirements. 
              The original designs are the intellectual property of the <a href="https://www.bot.go.tz/Currency/BanknotesAndCoinsIssued" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bank of Tanzania</a>. 
              Any misuse, reproduction, or distribution of these images in a manner that violates Tanzanian law or the Bank of Tanzania's guidelines is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Limitation of Liability</h2>
            <p>
              In no event shall TFM, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, 
              including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Governing Law</h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the United Republic of Tanzania, without regard to its conflict of law provisions.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
