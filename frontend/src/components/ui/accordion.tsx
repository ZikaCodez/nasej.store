import * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn(
        "overflow-hidden rounded-2xl border flex w-full flex-col bg-card/50 backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "not-last:border-b transition-colors data-open:bg-muted/40",
        className,
      )}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 px-5 py-4 text-left text-base font-medium border border-transparent transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 hover:text-foreground",
          className,
        )}
        {...props}>
        {children}
        <ChevronDown
          className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden text-muted-foreground"
          size={18}
          aria-hidden
        />
        <ChevronUp
          className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline text-muted-foreground"
          size={18}
          aria-hidden
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-open:animate-accordion-down data-closed:animate-accordion-up px-5 text-sm overflow-hidden"
      {...props}>
      <div
        className={cn(
          "pt-1 pb-5 h-(--radix-accordion-content-height) leading-relaxed text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
          className,
        )}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
