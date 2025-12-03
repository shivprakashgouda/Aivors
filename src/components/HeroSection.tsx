import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface HeroSectionProps {
  onBookDemoClick: () => void;
}

export const HeroSection = ({ onBookDemoClick }: HeroSectionProps) => {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Revolutionize Your business Communication with AI
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Aivors AI helps the average business recover 6-figures per year in lost revenue by ensuring every call is answered through AI — instantly, intelligently, and around the clock.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={onBookDemoClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg px-8 h-14"
              >
                Book A Demo
              </Button>
              {/* <Button
                size="lg"
                variant="outline"
                className="border-border bg-card hover:bg-muted text-foreground text-lg px-8 h-14"
              >
                Test How Our AI call works
              </Button> */}
              <a href="tel:+18327804868">
  <Button
    size="lg"
    variant="outline"
    className="border-border bg-card hover:bg-muted text-foreground text-lg px-8 h-14"
  >
    Test How Our AI Call Works
  </Button>
</a>

            </div>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">Trusted by 500+ businesss</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-card to-muted shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop"
                alt="Elegant business interior"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};
