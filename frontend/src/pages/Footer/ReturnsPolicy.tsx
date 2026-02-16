import SectionHeader from "@/components/common/SectionHeader";
import { CheckCircle2, XCircle, Info } from "lucide-react";

export default function ReturnsPolicy() {
  return (
    <div className="container mx-auto max-w-3xl py-10">
      <SectionHeader
        title="Return & Refund Policy"
        description="Everything you need to know about eligibility, conditions, and how to start a return."
        align="center"
      />

      <div className="mt-8 space-y-8">
        {/* Eligibility window */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Info className="size-5 text-muted-foreground" aria-hidden />
            Eligibility window
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              • You can request a return within <strong>7 days</strong> of
              delivery.
            </p>
            <p>
              • Within the first <strong>2 days</strong> of delivery, returns
              are accepted for any reason (fit/size preference, change of mind),
              provided the item is unused and in original condition.
            </p>
            <p>
              • After <strong>2 days</strong> and up to <strong>7 days</strong>,
              returns are accepted for manufacturing defects or significant
              issues that prevent normal use.
            </p>
          </div>
        </section>

        {/* Accepted conditions */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
            When returns are accepted
          </h3>
          <ul className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-2 list-disc pl-5">
            <li>
              Item is <strong>unused</strong>, in original condition, with all
              packaging, tags, and accessories included.
            </li>
            <li>
              Manufacturing defect or workmanship issue documented with
              photos/videos.
            </li>
            <li>
              Wrong item received, or wrong size/spec delivered compared to
              order confirmation.
            </li>
            <li>
              Damage sustained during shipping (report within{" "}
              <strong>48 hours</strong> of delivery with proof).
            </li>
          </ul>
        </section>

        {/* Rejection cases */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <XCircle className="size-5 text-destructive" aria-hidden />
            When returns may be rejected
          </h3>
          <ul className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-2 list-disc pl-5">
            <li>
              Signs of <strong>wear or use</strong>, stains, odors, or damage
              caused after delivery.
            </li>
            <li>
              Missing original packaging, tags, certificates, or included
              accessories.
            </li>
            <li>
              <strong>Customized</strong> or personalized items that were
              produced specifically to your request (unless defective).
            </li>
            <li>
              Final-sale or clearance items explicitly marked as{" "}
              <strong>non-returnable</strong>.
            </li>
            <li>
              Requests made <strong>after 7 days</strong> of delivery.
            </li>
          </ul>
        </section>

        {/* How to start */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold">How to start a return</h3>
          <ol className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-2 list-decimal pl-5">
            <li>
              Go to <strong>Account → Orders</strong> and select the relevant
              order.
            </li>
            <li>
              Choose <em>Request Return</em> and provide a brief description and
              photos (if applicable).
            </li>
            <li>
              We'll confirm eligibility, schedule courier pickup, and keep you
              updated.
            </li>
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">
            Refunds are issued to the original payment method. Once approved and
            processed, funds typically clear within{" "}
            <strong>3–10 business days</strong>, depending on your
            bank/provider.
          </p>
        </section>
      </div>
    </div>
  );
}
