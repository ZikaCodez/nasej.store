import SectionHeader from "@/components/common/SectionHeader";
import {
  FileText,
  ShieldCheck,
  CreditCard,
  Truck,
  RotateCcw,
  Copyright,
  AlertTriangle,
  Lock,
} from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="container mx-auto max-w-3xl py-10">
      <SectionHeader
        title="Terms of Service"
        description="Please read these terms carefully before using our website and services."
        align="center"
      />

      <div className="mt-8 space-y-8">
        {/* Use of the Site */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="size-5 text-muted-foreground" aria-hidden />
            Use of the Site
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              By accessing or using our website, you agree to comply with these
              Terms of Service and all applicable laws. You must be at least 16
              years old or have parental consent to place orders.
            </p>
            <p>
              You agree not to misuse the site, interfere with its operation, or
              attempt to access data without authorization.
            </p>
          </div>
        </section>

        {/* Account & Security */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="size-5 text-muted-foreground" aria-hidden />
            Account & Security
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities under your account.
            </p>
            <p>
              Notify us immediately of any unauthorized access or suspicious
              activity.
            </p>
          </div>
        </section>

        {/* Orders & Pricing */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="size-5 text-muted-foreground" aria-hidden />
            Orders & Pricing
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              All prices are shown in local currency and may change without
              prior notice. We reserve the right to cancel or refuse any order
              due to stock, pricing errors, or suspected fraud.
            </p>
            <p>
              If we cancel an order after payment is captured, you will receive
              a full refund.
            </p>
          </div>
        </section>

        {/* Shipping & Delivery */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="size-5 text-muted-foreground" aria-hidden />
            Shipping & Delivery
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Delivery estimates are provided for convenience and are not
              guaranteed. Delays may occur due to production schedules,
              logistics, or force majeure.
            </p>
            <p>
              You will receive tracking updates via WhatsApp/Instagram once your order
              ships.
            </p>
          </div>
        </section>

        {/* Returns & Refunds Summary */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <RotateCcw className="size-5 text-muted-foreground" aria-hidden />
            Returns & Refunds Summary
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Returns are subject to our Returns & Refunds Policy. In brief:
              returns are accepted within 7 days subject to condition, with
              specific rules for the first 2 days and defect-related claims.
            </p>
            <p>
              Please see the full policy at{" "}
              <a href="/returns-policy" className="text-primary underline">Returns & Refunds Policy</a> for
              detailed conditions and the return process.
            </p>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Copyright className="size-5 text-muted-foreground" aria-hidden />
            Intellectual Property
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              All content on the site (designs, images, text, and trademarks) is
              owned by us or our licensors and protected by applicable laws. You
              may not copy, redistribute, or use content without permission.
            </p>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle
              className="size-5 text-muted-foreground"
              aria-hidden
            />
            Limitation of Liability
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              To the maximum extent permitted by law, we are not liable for
              indirect, incidental, or consequential damages arising from your
              use of the site or products.
            </p>
          </div>
        </section>

        {/* Privacy & Cookies */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="size-5 text-muted-foreground" aria-hidden />
            Privacy & Cookies
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              We respect your privacy and use cookies to improve your
              experience. See our Privacy Policy for details on data collection,
              use, and your rights. (Link available in the footer.)
            </p>
          </div>
        </section>

        {/* Changes to Terms */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold">Changes to Terms</h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              We may update these terms from time to time. Changes take effect
              upon posting on this page. Continued use of the site constitutes
              acceptance of updated terms.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold">Contact Us</h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Questions about these terms? Reach out via the contact options
              listed in the footer.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
