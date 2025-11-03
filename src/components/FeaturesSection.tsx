import { Phone, DollarSign, Calendar, CheckCircle, Utensils, Settings } from "lucide-react";

const features = [
  {
    icon: Phone,
    title: "Never Miss An Order",
    description: "AI answers every call 24/7, so you never miss an opportunity to turn a customer inquiry into a sale.",
  },
  {
    icon: DollarSign,
    title: "Increase Your AOV",
    description: "Trained on your menu, AI will suggest pairings to each customer based on their order to increase average order value.",
  },
  {
    icon: Calendar,
    title: "Take Bookings & Triage Events",
    description: "AI handles all reservations and event inquiries—confirming, updating, or cancelling bookings—so no customer gets missed.",
  },
  {
    icon: CheckCircle,
    title: "Take Delivery & Takeout Orders",
    description: "Every delivery and takeout call is handled with pinpoint accuracy—no errors, no confusion. Smart upsells run in the background, increasing order value effortlessly.",
  },
  {
    icon: Utensils,
    title: "Plug Into Your POS",
    description: "With 45+ POS integrations, businessAI sends every order straight to your system—no manual input, no missed steps, and you'll never hear the phone ring again.",
  },
  {
    icon: Settings,
    title: "Your next superhuman employee",
    description: "Trained to talk like your best employee. Built to work like ten. businessAI handles your phones with speed, memory, and perfect accuracy—24/7.",
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 px-6 bg-card/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Unlock the <span className="text-primary">profits</span> in your business's operations
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            With businessAI your staff can focus their time and energy on in-person customers, while never having to worry about the phone ringing again.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
