import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "How will my kitchen be able to receive the orders that AI takes?",
    answer: "Our AI integrates directly with your existing POS system. Orders are automatically sent to your kitchen display or receipt printer, just like online orders.",
  },
  {
    question: "How will AI handle customers who struggle to speak English?",
    answer: "Our AI is multilingual and can communicate in over 20 languages, breaking down language barriers so you never miss a customer or their order.",
  },
  {
    question: "How would you provide us with support, and do we need to pay for it?",
    answer: "We provide 24/7 technical support at no additional cost. Our team monitors your AI's performance and makes adjustments to optimize results.",
  },
  {
    question: "Will I be able to see a report of how AI is doing?",
    answer: "Absolutely! You'll have access to a detailed dashboard showing call volume, order conversion rates, revenue generated, and customer satisfaction metrics.",
  },
  {
    question: "Can AI process payments over the phone?",
    answer: "Yes! Our AI can securely process credit card payments over the phone, integrating with your existing payment processor.",
  },
];

interface FAQSectionProps {
  onBookDemoClick: () => void;
}

export const FAQSection = ({ onBookDemoClick }: FAQSectionProps) => {
  return (
    <section id="faq" className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Common questions</h2>
          <p className="text-xl text-muted-foreground">
            Still have questions? We've answered some of the most common queries below to help you make an informed decision.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-2xl px-6 bg-card hover:bg-muted/50 transition-colors"
            >
              <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <Button
            size="lg"
            onClick={onBookDemoClick}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg px-8 h-14"
          >
            Book A Demo
          </Button>
        </div>
      </div>
    </section>
  );
};
