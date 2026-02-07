import SectionHeader from "@/components/common/SectionHeader";
import {
  User,
  IdCard,
  Cookie as CookieIcon,
  Database,
  Share2,
  ShieldCheck,
  Trash2,
  Mail,
} from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto max-w-3xl py-10">
      <SectionHeader
        title="Privacy Policy"
        description="How we collect, use, and protect your information."
        align="center"
      />

      <div className="mt-8 space-y-8">
        {/* What we collect */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="size-5 text-muted-foreground" aria-hidden />
            Information we collect
          </h3>
          <ul className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-2 list-disc pl-5">
            <li>
              <strong>Account information</strong>: name and email (from Google
              OAuth). We also store a numeric account ID and your role (e.g.,
              customer).
            </li>
            <li>
              <strong>Profile details</strong>: phone number (11 digits),
              addresses, wishlist, and cart items you save.
            </li>
            <li>
              <strong>Orders</strong>: items purchased (including SKU, quantity,
              and price at purchase), shipping address, payment method/status,
              order status, totals, and tracking number.
            </li>
            <li>
              <strong>Promo usage</strong>: applied promo codes and calculated
              discounts.
            </li>
            <li>
              <strong>Session data</strong>: a session identifier stored in a
              secure, HTTP-only cookie to keep you signed in.
            </li>
            <li>
              <strong>Optional credentials</strong>: if you register using
              email/password (not required), we store your password in{" "}
              <em>hashed</em> form.
            </li>
          </ul>
        </section>

        {/* How we use it */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <IdCard className="size-5 text-muted-foreground" aria-hidden />
            How we use your information
          </h3>
          <ul className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-2 list-disc pl-5">
            <li>
              <strong>Authentication & account</strong>: sign in via Google,
              maintain your session, and secure access to your account.
            </li>
            <li>
              <strong>Order processing</strong>: create, update, and deliver
              orders; provide status updates and tracking.
            </li>
            <li>
              <strong>Customer support</strong>: assist with returns,
              cancellations, and post‑purchase questions.
            </li>
            <li>
              <strong>Personalization</strong>: remember your wishlist and cart
              items for a smoother shopping experience.
            </li>
            <li>
              <strong>Improvement & reliability</strong>: use aggregate,
              non‑personal order and product metrics to improve operations.
            </li>
          </ul>
        </section>

        {/* Cookies & sessions */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CookieIcon className="size-5 text-muted-foreground" aria-hidden />
            Cookies & sessions
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              We use an <strong>HTTP‑only session cookie</strong> to keep you
              signed in securely. In production, this cookie is set with{" "}
              <strong>SameSite=\"None\"</strong> and <strong>Secure</strong> to
              support sign‑in across our domains.
            </p>
            <p>
              Session records are stored in our database (MongoDB) and include
              only data needed to manage your login state.
            </p>
          </div>
        </section>

        {/* Data storage */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="size-5 text-muted-foreground" aria-hidden />
            Data storage & security
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Your account, orders, and session data are stored in our managed
              database. We use industry‑standard practices to protect accounts,
              including hashed passwords (if provided) and role‑based access.
            </p>
            <p>
              We continuously improve safeguards to protect against unauthorized
              access and misuse.
            </p>
          </div>
        </section>

        {/* Sharing */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="size-5 text-muted-foreground" aria-hidden />
            When we share information
          </h3>
          <ul className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-2 list-disc pl-5">
            <li>
              <strong>Delivery partners</strong>: to fulfill shipping and
              provide tracking.
            </li>
            <li>
              <strong>Payment providers</strong>: to process payments and handle
              refunds.
            </li>
            <li>
              <strong>Legal & compliance</strong>: if required to comply with
              law or protect our rights.
            </li>
            <li>
              We do <strong>not sell</strong> your personal information.
            </li>
          </ul>
        </section>

        {/* Retention & deletion */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trash2 className="size-5 text-muted-foreground" aria-hidden />
            Data retention & deletion
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              We retain account and order records for operational and legal
              purposes. If you delete your account, we deactivate it and may
              retain completed order records (e.g., delivered/paid) for
              compliance and accounting.
            </p>
            <p>You can request account deletion or data access via support.</p>
          </div>
        </section>

        {/* Your rights */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="size-5 text-muted-foreground" aria-hidden />
            Your rights & choices
          </h3>
          <ul className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-2 list-disc pl-5">
            <li>
              Access and update your profile, addresses, and orders from
              Account.
            </li>
            <li>
              Request cancellations while orders are in Processing; request
              returns under our policy.
            </li>
            <li>
              Contact us to request account deletion or a copy of your data.
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border bg-card/50 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="size-5 text-muted-foreground" aria-hidden />
            Contact us
          </h3>
          <div className="mt-4 text-sm leading-relaxed text-muted-foreground space-y-3">
            <p>
              Questions about this Privacy Policy or your data? Reach out using
              the contact links in the footer.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
