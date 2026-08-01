"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

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
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
          onSelect={(date) => {
            onChange?.(date)
            if (date) setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

interface MonthPickerProps {
  value?: string
  onChange?: (month: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MonthPicker({
  value,
  onChange,
  placeholder = "Pick a month",
  className,
  disabled,
}: MonthPickerProps) {
  const parsedYear = Number(value?.slice(0, 4))
  const [displayYear, setDisplayYear] = React.useState(
    Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : new Date().getFullYear()
  )
  const [open, setOpen] = React.useState(false)
  const selectedMonth = value ? Number(value.slice(5, 7)) - 1 : -1
  const selectedYear = value ? Number(value.slice(0, 4)) : -1
  const monthNames = Array.from({ length: 12 }, (_, index) =>
    new Date(2000, index, 1).toLocaleString(undefined, { month: "short" })
  )

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen && Number.isFinite(parsedYear) && parsedYear > 0) setDisplayYear(parsedYear)
        setOpen(nextOpen)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start rounded-md text-left font-normal", !value && "text-muted-foreground", className)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value
            ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 rounded-xl p-3" align="start">
        <div className="mb-3 flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" onClick={() => setDisplayYear((year) => year - 1)} aria-label="Previous year">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-bold">{displayYear}</span>
          <Button type="button" variant="ghost" size="icon" onClick={() => setDisplayYear((year) => year + 1)} aria-label="Next year">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {monthNames.map((monthName, monthIndex) => {
            const selected = displayYear === selectedYear && monthIndex === selectedMonth
            return (
              <Button
                key={monthName}
                type="button"
                variant={selected ? "default" : "ghost"}
                className="h-9 text-xs"
                onClick={() => {
                  onChange?.(`${displayYear}-${String(monthIndex + 1).padStart(2, "0")}`)
                  setOpen(false)
                }}
              >
                {monthName}
              </Button>
            )
          })}
        </div>
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
