"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal rounded-md",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-md" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
        />
      </PopoverContent>
    </Popover>
  )
}

/** Utility to format a Date to a "YYYY-MM-DD" string (for API calls) */
export function formatDateToString(date: Date | undefined): string {
  if (!date) return ""
  return format(date, "yyyy-MM-dd")
}

/** Utility to parse a "YYYY-MM-DD" string back to Date */
export function parseDateString(value: string): Date | undefined {
  if (!value) return undefined
  const d = new Date(value + "T00:00:00")
  return isNaN(d.getTime()) ? undefined : d
}
