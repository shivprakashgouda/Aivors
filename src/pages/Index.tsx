import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingSection } from "@/components/PricingSection";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { SignInModal } from "@/components/SignInModal";
import { BookDemoModal } from "@/components/BookDemoModal";

const Index = () => {
  const [signInOpen, setSignInOpen] = useState(false);
  const [bookDemoOpen, setBookDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        onSignInClick={() => setSignInOpen(true)}
        onBookDemoClick={() => setBookDemoOpen(true)}
      />
      <HeroSection onBookDemoClick={() => setBookDemoOpen(true)} />
      <FeaturesSection />
      <PricingSection />
      <FAQSection onBookDemoClick={() => setBookDemoOpen(true)} />
      <Footer onBookDemoClick={() => setBookDemoOpen(true)} />
      
      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
      <BookDemoModal open={bookDemoOpen} onOpenChange={setBookDemoOpen} />
    </div>
  );
};

export default Index;
