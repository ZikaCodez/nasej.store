"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export type DatePickerWithRangeProps = {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
  buttonClassName?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
};

export function DatePickerWithRange({
  value,
  onChange,
  className,
  buttonClassName,
  variant = "outline",
  size = "default",
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(
    value ?? {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: addDays(new Date(), 6),
    },
  );
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (value) {
      setDate(value);
    }
  }, [value]);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  function handleSelect(next: DateRange | undefined) {
    setDate(next);
    onChange?.(next);
  }

  const label = React.useMemo(() => {
    if (!date?.from && !date?.to) return "Custom";
    if (date.from && date.to) {
      return `${format(date.from, "LLL dd, y")} - ${format(
        date.to,
        "LLL dd, y",
      )}`;
    }
    if (date.from) {
      return format(date.from, "LLL dd, y");
    }
    if (date.to) {
      return format(date.to, "LLL dd, y");
    }
    return "Custom";
  }, [date]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn(
            "justify-start px-2.5 font-normal gap-1.5 w-full md:w-auto",
            buttonClassName,
          )}>
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="text-xs sm:text-sm truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[90vw] p-0 max-w-max", className)}
        align={isMobile ? "center" : "end"}
        side={isMobile ? "bottom" : "bottom"}>
        <div className="overflow-x-auto">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from ?? new Date()}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={isMobile ? 1 : 2}
            disabled={(d) => d > new Date()}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
