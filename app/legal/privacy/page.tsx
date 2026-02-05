import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/app/_components/landing-sections";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose dark:prose-invert max-w-none space-y-6">
          <p className="text-sm text-muted-foreground">Last Updated: 2/5/2026</p>

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p>
              Trust Funding Microfinance ("TFM", "we", "us", or "our") respects your privacy and is committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) 
              and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Data We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Identity Data:</strong> includes full name, date of birth, marital status, National ID (NIDA) Number, and applicant photo (selfie).</li>
              <li><strong>Contact Data:</strong> includes phone number, email address, residence address (street, house number, ward, district, region), and residence ownership status.</li>
              <li><strong>Employment Data:</strong> includes employment status, company/business name, address, and position.</li>
              <li><strong>Financial Data:</strong> includes loan details (amount, purpose, existing loans) and bank account or mobile money details for disbursement/repayment.</li>
              <li><strong>Collateral Data:</strong> includes details of assets pledged as collateral and supporting documents.</li>
              <li><strong>Guarantor Data:</strong> includes name, phone number, relationship, residence, and NIDA number of your guarantors.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Data</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., processing your loan application).</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal or regulatory obligation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Intellectual Property & Currency Images</h2>
            <p>
              <strong>Currency Images Disclaimer:</strong> Images of Tanzanian currency displayed on this website are for illustrative and educational purposes only. 
              They are not legal tender. These images are reproductions used in accordance with guidelines to prevent confusion with genuine currency. 
              The source of these images is the <a href="https://www.bot.go.tz/Currency/BanknotesAndCoinsIssued" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Bank of Tanzania</a>. 
              All rights to the currency designs remain with the Bank of Tanzania.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. 
              In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
              <br />
              Email: privacy@chapchap.co.tz
              <br />
              Phone: +255 123 456 789
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
