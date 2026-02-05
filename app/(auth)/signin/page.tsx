import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding and Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        {/* Abstract background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10 text-white max-w-md">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center p-4 shadow-2xl mb-6">
              <Image 
                src="/icon_only.png" 
                alt="TFM Logo" 
                width={64} 
                height={64} 
                className="object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold mb-4">Chap Chap</h1>
            <p className="text-xl text-primary-foreground/80 leading-relaxed">
              Efficient loan management and financial analytics for modern businesses.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-1">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Portfolio Tracking</h3>
                <p className="text-primary-foreground/70">Real-time monitoring of your loan portfolio and repayments.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-1">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Financial Analytics</h3>
                <p className="text-primary-foreground/70">Detailed reports and insights into your business growth.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Image 
              src="/icon_only.png" 
              alt="TFM Logo" 
              width={48} 
              height={48} 
              className="mb-4"
            />
            <h2 className="text-2xl font-bold text-primary">Chap Chap</h2>
          </div>
          
            <SignIn 
              routing="path" 
              path="/signin"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-none p-6",
                  headerTitle: "text-2xl font-bold text-slate-900",
                  headerSubtitle: "text-slate-500",
                  socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50 transition-colors",
                  formButtonPrimary: "bg-primary hover:bg-primary/90 transition-all",
                  footerActionLink: "text-primary hover:text-primary/90",
                  formFieldInput: "border-slate-200 focus:border-primary focus:ring-primary",
                }
              }}
            />
          
          
          <p className="mt-8 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} TFM - Chap Chap. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
