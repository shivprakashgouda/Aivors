import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FooterProps {
  onBookDemoClick: () => void;
}

export const Footer = ({ onBookDemoClick }: FooterProps) => {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Aivors</span>
            </div>
            <p className="text-muted-foreground">
              Revolutionizing business communication with AI-powered phone management.
            </p>
            <div className="text-muted-foreground text-sm space-y-1">
              <p>5900 Balcones Dr, Ste 100</p>
              <p>Austin, TX 78731-4298</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">CONTACT</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>Phone: (409) 960-2907</p>
              <p>Support: info@business-ai.com</p>
              <p>Looking to invest: invest@business-ai.com</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4">SOCIALS</h3>
            <div className="space-y-2">
              <a href="#" className="block text-secondary hover:text-secondary/80 transition-colors">
                Youtube
              </a>
              <a href="#" className="block text-secondary hover:text-secondary/80 transition-colors">
                Instagram
              </a>
              <a href="#" className="block text-secondary hover:text-secondary/80 transition-colors">
                LinkedIn
              </a>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={onBookDemoClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              Book A Demo
            </Button>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-muted-foreground">
          <p>© 2025 by Aivors</p>
        </div>
      </div>
    </footer>
  );
};
