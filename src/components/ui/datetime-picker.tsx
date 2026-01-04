"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DateTimePickerProps {
  value?: string // Format: "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Izaberite datum i vrijeme",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse the value to Date
  const dateValue = value ? new Date(value) : undefined

  // Local state for time inputs
  const [timeInput, setTimeInput] = React.useState({
    hours: dateValue ? String(dateValue.getHours()).padStart(2, '0') : '00',
    minutes: dateValue ? String(dateValue.getMinutes()).padStart(2, '0') : '00'
  })

  // Update time inputs when value changes externally
  React.useEffect(() => {
    if (dateValue) {
      setTimeInput({
        hours: String(dateValue.getHours()).padStart(2, '0'),
        minutes: String(dateValue.getMinutes()).padStart(2, '0')
      })
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange('')
      return
    }

    // Set the time from current time inputs
    date.setHours(parseInt(timeInput.hours))
    date.setMinutes(parseInt(timeInput.minutes))
    date.setSeconds(0, 0)

    // Format to datetime-local format
    const formatted = format(date, "yyyy-MM-dd'T'HH:mm")
    onChange(formatted)
  }

  const handleTimeChange = (hours: string, minutes: string) => {
    setTimeInput({ hours, minutes })

    if (dateValue) {
      const newDate = new Date(dateValue)
      newDate.setHours(parseInt(hours))
      newDate.setMinutes(parseInt(minutes))
      newDate.setSeconds(0, 0)

      const formatted = format(newDate, "yyyy-MM-dd'T'HH:mm")
      onChange(formatted)
    }
  }

  const handleNow = () => {
    const now = new Date()
    const formatted = format(now, "yyyy-MM-dd'T'HH:mm")
    onChange(formatted)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-slate-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? (
            format(dateValue, "dd.MM.yyyy HH:mm")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <div className="p-4">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={handleDateSelect}
              defaultMonth={dateValue}
              className="rounded-md border-0"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([data-selected-single=true]_button)]:bg-slate-900 [&:has([data-selected-single=true]_button)]:rounded-md",
                day: "h-10 w-10 p-0 font-normal data-[selected-single=true]:!bg-slate-900 data-[selected-single=true]:!text-white data-[selected-single=true]:hover:!bg-slate-800",
                day_today: "bg-slate-100 text-slate-900 font-semibold",
                button_previous: "h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-slate-100",
                button_next: "h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-slate-100",
              }}
            />
          </div>

          <div className="border-t p-4 space-y-4">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Vrijeme
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="23"
                value={timeInput.hours}
                onChange={(e) => {
                  const val = Math.min(23, Math.max(0, parseInt(e.target.value) || 0))
                  const newHours = val.toString().padStart(2, '0')
                  handleTimeChange(newHours, timeInput.minutes)
                }}
                className="w-16 text-center"
                placeholder="HH"
              />
              <span className="text-lg font-semibold">:</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={timeInput.minutes}
                onChange={(e) => {
                  const val = Math.min(59, Math.max(0, parseInt(e.target.value) || 0))
                  const newMinutes = val.toString().padStart(2, '0')
                  handleTimeChange(timeInput.hours, newMinutes)
                }}
                className="w-16 text-center"
                placeholder="MM"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={handleNow}
              >
                Sada
              </Button>
              <Button
                type="button"
                size="sm"
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
                onClick={() => setOpen(false)}
              >
                Potvrdi
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
