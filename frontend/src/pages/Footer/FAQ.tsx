import SectionHeader from "@/components/common/SectionHeader";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Truck, Undo2, Ban } from "lucide-react";

export default function FAQ() {
  return (
    <div className="container mx-auto max-w-3xl py-10">
      <SectionHeader
        title="Frequently Asked Questions"
        description="Clear answers about delivery, returns, and cancellations."
        align="center"
      />
      <div className="mt-8">
        <Accordion type="single" collapsible>
          <AccordionItem value="delivery">
            <AccordionTrigger>
              <span className="inline-flex items-center gap-2 text-base font-semibold">
                <Truck className="size-5 text-muted-foreground" aria-hidden />
                Delivery times
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p>
                Each piece is crafted to order. We dispatch within
                <strong> 2–5 business days</strong>, with nationwide delivery
                typically arriving in <strong>3–7 business days</strong> after
                confirmation.
              </p>
              <p>
                You'll receive SMS/email updates with tracking details. Need it
                sooner? Contact us after checkout and we'll do our best to
                prioritize.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="returns">
            <AccordionTrigger>
              <span className="inline-flex items-center gap-2 text-base font-semibold">
                <Undo2 className="size-5 text-muted-foreground" aria-hidden />
                How to return
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p>
                If something isn't quite right, you can request a return within
                <strong> 7 days</strong> of delivery. Items must be unused and
                in their original condition/packaging.
              </p>
              <p>
                To start a return, open <strong>Account &rarr; Orders</strong>,
                select your order, and choose <em>Request Return</em>. Our team
                will arrange a courier pickup and keep you updated at each step.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cancellations">
            <AccordionTrigger>
              <span className="inline-flex items-center gap-2 text-base font-semibold">
                <Ban className="size-5 text-muted-foreground" aria-hidden />
                How to cancel and cancellation policy
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <p>
                You can cancel while the order is in <strong>processing</strong>
                . Once production begins, cancellations may no longer be
                possible.
              </p>
              <p>
                To cancel, go to <strong>Account &rarr; Orders</strong> and
                select <em>Cancel Order</em>. If payment has been captured,
                refunds are issued to the original method and typically clear
                within <strong>3–10 business days</strong> (depending on your
                bank/provider).
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
