"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export function TimePicker({ value, onChange, disabled, className }: TimePickerProps) {
  // value is expected to be "HH:mm" in 24h format
  const [hour, setHour] = React.useState<string>(value?.split(":")[0] || "")
  const [minute, setMinute] = React.useState<string>(value?.split(":")[1] || "")

  React.useEffect(() => {
    if (value) {
      const parts = value.split(":")
      if (parts.length === 2) {
        setHour(parts[0])
        setMinute(parts[1])
      }
    } else {
      setHour("")
      setMinute("")
    }
  }, [value])

  const handleHourChange = (newHour: string) => {
    setHour(newHour)
    // If minute is empty when hour is selected, default to "00"
    const minToUse = minute || "00"
    setMinute(minToUse)
    onChange?.(`${newHour}:${minToUse}`)
  }

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute)
    const hrToUse = hour || "00"
    setHour(hrToUse)
    onChange?.(`${hrToUse}:${newMinute}`)
  }

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <Select value={hour} onValueChange={handleHourChange} disabled={disabled}>
        <SelectTrigger className="w-[80px] rounded-md focus:ring-ring">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground font-medium">:</span>
      <Select value={minute} onValueChange={handleMinuteChange} disabled={disabled}>
        <SelectTrigger className="w-[80px] rounded-md focus:ring-ring">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Clock className="w-4 h-4 text-muted-foreground ml-1" />
    </div>
  )
}
