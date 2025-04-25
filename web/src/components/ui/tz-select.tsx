"use client";

import { useState, useMemo } from "react";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FormControl } from "@/components/ui/form";

// Define the timezone interface
export interface TimezoneOption {
  id: string; // Unique identifier for each timezone option
  label: string; // City name
  gmt: string; // GMT offset (typically shows standard time)
  gmtDst?: string; // GMT offset during daylight saving time
  us?: string; // US timezone code
}

// List of timezones with one entry per city - focusing on standard time with US codes
export const timezones: TimezoneOption[] = [
  // North America
  {
    id: "1",
    label: "America/New_York",
    gmt: "GMT-5",
    gmtDst: "GMT-4",
    us: "EST",
  },
  {
    id: "2",
    label: "America/Chicago",
    gmt: "GMT-6",
    gmtDst: "GMT-5",
    us: "CST",
  },
  {
    id: "3",
    label: "America/Denver",
    gmt: "GMT-7",
    gmtDst: "GMT-6",
    us: "MST",
  },
  {
    id: "4",
    label: "America/Los_Angeles",
    gmt: "GMT-8",
    gmtDst: "GMT-7",
    us: "PST",
  },
  { id: "5", label: "America/Phoenix", gmt: "GMT-7", us: "MST" }, // Arizona doesn't use DST
  {
    id: "6",
    label: "America/Anchorage",
    gmt: "GMT-9",
    gmtDst: "GMT-8",
    us: "AKST",
  },
  { id: "7", label: "America/Adak", gmt: "GMT-10", gmtDst: "GMT-9", us: "HST" },
  { id: "8", label: "America/Honolulu", gmt: "GMT-10", us: "HST" }, // Hawaii Standard Time (no DST)
  {
    id: "9",
    label: "America/Toronto",
    gmt: "GMT-5",
    gmtDst: "GMT-4",
    us: "EST",
  },
  {
    id: "10",
    label: "America/Vancouver",
    gmt: "GMT-8",
    gmtDst: "GMT-7",
    us: "PST",
  },
  {
    id: "11",
    label: "America/Edmonton",
    gmt: "GMT-7",
    gmtDst: "GMT-6",
    us: "MST",
  },
  {
    id: "12",
    label: "America/Winnipeg",
    gmt: "GMT-6",
    gmtDst: "GMT-5",
    us: "CST",
  },
  {
    id: "13",
    label: "America/Halifax",
    gmt: "GMT-4",
    gmtDst: "GMT-3",
    us: "AST",
  },
  {
    id: "14",
    label: "America/St_Johns",
    gmt: "GMT-3:30",
    gmtDst: "GMT-2:30",
    us: "NST",
  },
  {
    id: "15",
    label: "America/Detroit",
    gmt: "GMT-5",
    gmtDst: "GMT-4",
    us: "EST",
  },
  {
    id: "16",
    label: "America/Indianapolis",
    gmt: "GMT-5",
    gmtDst: "GMT-4",
    us: "EST",
  },
  {
    id: "17",
    label: "America/Louisville",
    gmt: "GMT-5",
    gmtDst: "GMT-4",
    us: "EST",
  },
  {
    id: "18",
    label: "America/Boise",
    gmt: "GMT-7",
    gmtDst: "GMT-6",
    us: "MST",
  },
  {
    id: "19",
    label: "America/Juneau",
    gmt: "GMT-9",
    gmtDst: "GMT-8",
    us: "AKST",
  },
  { id: "20", label: "America/Puerto_Rico", gmt: "GMT-4", us: "AST" }, // Atlantic Standard Time (no DST)

  // Central & South America
  { id: "21", label: "America/Mexico_City", gmt: "GMT-6", gmtDst: "GMT-5" },
  { id: "22", label: "America/Bogota", gmt: "GMT-5" },
  { id: "23", label: "America/Lima", gmt: "GMT-5" },
  { id: "24", label: "America/Rio_Branco", gmt: "GMT-5" },
  { id: "25", label: "America/Santiago", gmt: "GMT-4", gmtDst: "GMT-3" },
  { id: "26", label: "America/Caracas", gmt: "GMT-4" },
  { id: "27", label: "America/Sao_Paulo", gmt: "GMT-3" },
  { id: "28", label: "America/Argentina/Buenos_Aires", gmt: "GMT-3" },
  { id: "29", label: "America/Montevideo", gmt: "GMT-3" },
  { id: "30", label: "America/Manaus", gmt: "GMT-4" },
  { id: "31", label: "America/La_Paz", gmt: "GMT-4" },
  { id: "32", label: "America/Asuncion", gmt: "GMT-4", gmtDst: "GMT-3" },
  { id: "33", label: "America/Guayaquil", gmt: "GMT-5" },

  // Europe
  { id: "34", label: "Europe/London", gmt: "GMT+0", gmtDst: "GMT+1" },
  { id: "35", label: "Europe/Dublin", gmt: "GMT+0", gmtDst: "GMT+1" },
  { id: "36", label: "Europe/Lisbon", gmt: "GMT+0", gmtDst: "GMT+1" },
  { id: "37", label: "Europe/Paris", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "38", label: "Europe/Madrid", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "39", label: "Europe/Berlin", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "40", label: "Europe/Rome", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "41", label: "Europe/Amsterdam", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "42", label: "Europe/Brussels", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "43", label: "Europe/Vienna", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "44", label: "Europe/Zurich", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "45", label: "Europe/Prague", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "46", label: "Europe/Copenhagen", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "47", label: "Europe/Stockholm", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "48", label: "Europe/Oslo", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "49", label: "Europe/Budapest", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "50", label: "Europe/Warsaw", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "51", label: "Europe/Belgrade", gmt: "GMT+1", gmtDst: "GMT+2" },
  { id: "52", label: "Europe/Athens", gmt: "GMT+2", gmtDst: "GMT+3" },
  { id: "53", label: "Europe/Helsinki", gmt: "GMT+2", gmtDst: "GMT+3" },
  { id: "54", label: "Europe/Bucharest", gmt: "GMT+2", gmtDst: "GMT+3" },
  { id: "55", label: "Europe/Kiev", gmt: "GMT+2", gmtDst: "GMT+3" },
  { id: "56", label: "Europe/Moscow", gmt: "GMT+3" },

  // Africa
  { id: "57", label: "Africa/Cairo", gmt: "GMT+2" },
  { id: "58", label: "Africa/Johannesburg", gmt: "GMT+2" },
  { id: "59", label: "Africa/Lagos", gmt: "GMT+1" },
  { id: "60", label: "Africa/Nairobi", gmt: "GMT+3" },
  { id: "61", label: "Africa/Casablanca", gmt: "GMT+0", gmtDst: "GMT+1" },
  { id: "62", label: "Africa/Algiers", gmt: "GMT+1" },
  { id: "63", label: "Africa/Tunis", gmt: "GMT+1" },
  { id: "64", label: "Africa/Accra", gmt: "GMT+0" },
  { id: "65", label: "Africa/Addis_Ababa", gmt: "GMT+3" },
  { id: "66", label: "Africa/Abidjan", gmt: "GMT+0" },
  { id: "67", label: "Africa/Khartoum", gmt: "GMT+2" },
  { id: "68", label: "Africa/Tripoli", gmt: "GMT+2" },
  { id: "69", label: "Africa/Maputo", gmt: "GMT+2" },

  // Asia & Middle East
  { id: "70", label: "Asia/Dubai", gmt: "GMT+4" },
  { id: "71", label: "Asia/Muscat", gmt: "GMT+4" },
  { id: "72", label: "Asia/Tehran", gmt: "GMT+3:30", gmtDst: "GMT+4:30" },
  { id: "73", label: "Asia/Kabul", gmt: "GMT+4:30" },
  { id: "74", label: "Asia/Karachi", gmt: "GMT+5" },
  { id: "75", label: "Asia/Mumbai", gmt: "GMT+5:30" },
  { id: "76", label: "Asia/Kolkata", gmt: "GMT+5:30" },
  { id: "77", label: "Asia/Kathmandu", gmt: "GMT+5:45" },
  { id: "78", label: "Asia/Dhaka", gmt: "GMT+6" },
  { id: "79", label: "Asia/Yangon", gmt: "GMT+6:30" },
  { id: "80", label: "Asia/Bangkok", gmt: "GMT+7" },
  { id: "81", label: "Asia/Jakarta", gmt: "GMT+7" },
  { id: "82", label: "Asia/Singapore", gmt: "GMT+8" },
  { id: "83", label: "Asia/Kuala_Lumpur", gmt: "GMT+8" },
  { id: "84", label: "Asia/Manila", gmt: "GMT+8" },
  { id: "85", label: "Asia/Hong_Kong", gmt: "GMT+8" },
  { id: "86", label: "Asia/Shanghai", gmt: "GMT+8" },
  { id: "87", label: "Asia/Taipei", gmt: "GMT+8" },
  { id: "88", label: "Asia/Seoul", gmt: "GMT+9" },
  { id: "89", label: "Asia/Tokyo", gmt: "GMT+9" },
  { id: "90", label: "Asia/Riyadh", gmt: "GMT+3" },
  { id: "91", label: "Asia/Baghdad", gmt: "GMT+3" },
  { id: "92", label: "Asia/Jerusalem", gmt: "GMT+2", gmtDst: "GMT+3" },
  { id: "93", label: "Asia/Beirut", gmt: "GMT+2", gmtDst: "GMT+3" },
  { id: "94", label: "Asia/Qatar", gmt: "GMT+3" },
  { id: "95", label: "Asia/Kuwait", gmt: "GMT+3" },
  { id: "96", label: "Asia/Istanbul", gmt: "GMT+3" },

  // Australia & Pacific
  { id: "97", label: "Australia/Perth", gmt: "GMT+8" },
  { id: "98", label: "Australia/Eucla", gmt: "GMT+8:45" },
  { id: "99", label: "Australia/Darwin", gmt: "GMT+9:30" },
  {
    id: "100",
    label: "Australia/Adelaide",
    gmt: "GMT+9:30",
    gmtDst: "GMT+10:30",
  },
  { id: "101", label: "Australia/Brisbane", gmt: "GMT+10" },
  { id: "102", label: "Australia/Sydney", gmt: "GMT+10", gmtDst: "GMT+11" },
  { id: "103", label: "Australia/Melbourne", gmt: "GMT+10", gmtDst: "GMT+11" },
  { id: "104", label: "Australia/Hobart", gmt: "GMT+10", gmtDst: "GMT+11" },
  {
    id: "105",
    label: "Australia/Lord_Howe",
    gmt: "GMT+10:30",
    gmtDst: "GMT+11",
  },
  { id: "106", label: "Pacific/Auckland", gmt: "GMT+12", gmtDst: "GMT+13" },
  { id: "107", label: "Pacific/Fiji", gmt: "GMT+12", gmtDst: "GMT+13" },
  { id: "108", label: "Pacific/Honolulu", gmt: "GMT-10", us: "HST" },
  { id: "109", label: "Pacific/Midway", gmt: "GMT-11" },
  { id: "110", label: "Pacific/Samoa", gmt: "GMT-11" },
  { id: "111", label: "Pacific/Guam", gmt: "GMT+10" },
  { id: "112", label: "Pacific/Noumea", gmt: "GMT+11" },

  // UTC
  { id: "113", label: "UTC", gmt: "GMT+0" },
];

interface TimezoneSelectProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function TimezoneSelect({
  value,
  onChange,
  className,
  placeholder = "Select time zone",
}: TimezoneSelectProps) {
  // Control popover state
  const [open, setOpen] = useState(false);

  // Search query state
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search query when popover opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // Reset search query when popover opens
    if (newOpen) {
      setSearchQuery("");
    }
  };

  // Filtered timezones based on search query and current selection
  const filteredTimezones = useMemo(() => {
    const timezonesWithSelection = [...timezones];

    // If there's a search query, filter the timezones
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return timezonesWithSelection.filter(
        (tz) =>
          // Search by timezone name (e.g., "America/New_York")
          tz.label.toLowerCase().includes(query) ||
          // Search by GMT offset (e.g., "GMT+2", "GMT-4")
          tz.gmt.toLowerCase().includes(query) ||
          // Search by US timezone code if available (e.g., "EDT", "PST")
          tz.us?.toLowerCase().includes(query) ||
          false
      );
    }

    // If there's a selected timezone, move it to the top of the list
    if (value) {
      const selectedIndex = timezonesWithSelection.findIndex(
        (tz) => tz.label === value
      );
      if (selectedIndex !== -1) {
        // Remove it from its original position
        const selectedTimezone = timezonesWithSelection.splice(
          selectedIndex,
          1
        )[0];
        // Add it to the beginning of the array
        timezonesWithSelection.unshift(selectedTimezone);
      }
    }

    return timezonesWithSelection;
  }, [searchQuery, value]);

  // Get the display value for the button
  const selectedTimezone = value
    ? timezones.find((tz) => tz.label === value)?.label
    : placeholder;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            className,
            !value && "text-muted-foreground"
          )}
        >
          {selectedTimezone}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search by city, GMT offset, or timezone code..."
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No time zone found.</CommandEmpty>
          <CommandGroup>
            <CommandList className="max-h-[300px] overflow-auto">
              {filteredTimezones.map((tz) => (
                <CommandItem
                  value={tz.label}
                  key={tz.id}
                  onSelect={() => {
                    onChange(tz.label);
                    setOpen(false); // Close the popover after selection
                  }}
                  className="px-2 py-1.5"
                >
                  <CheckIcon
                    className={cn(
                      "mr-1 h-4 w-4",
                      tz.label === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex w-full justify-between items-center">
                    <span className="truncate mr-1.5">{tz.label}</span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      ({tz.gmt}{tz.gmtDst ? `/${tz.gmtDst}` : ""}{tz.us ? ` - ${tz.us}` : ""})
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface TimezoneSelectFieldProps extends TimezoneSelectProps {
  useFormControl?: boolean;
}

export function TimezoneSelectField({
  value,
  onChange,
  className,
  placeholder,
  useFormControl = true,
}: TimezoneSelectFieldProps) {
  const select = (
    <TimezoneSelect
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
    />
  );

  // Return the select with or without form control wrapper
  return useFormControl ? <FormControl>{select}</FormControl> : select;
}
