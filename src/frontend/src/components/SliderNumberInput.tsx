import type { ChangeEvent } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Slider } from "./ui/slider";

type SliderNumberInputProps = {
  label: string;
  value: number | string | null | undefined;
  onChange: (value: number | string) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  prefix?: string;
  placeholder?: string;
};
export default function SliderNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = "",
  prefix = "",
  placeholder = "Optional",
}: SliderNumberInputProps) {
  const numericValue = value === "" || value === null || value === undefined ? "" : Number(value);
  const isOverridden = numericValue !== "" && numericValue > max;
  const isBelowMin = numericValue !== "" && numericValue < min;

  // Slider is clamped to [min, max]
  const sliderValue = numericValue === "" ? min : Math.min(max, Math.max(min, numericValue));

  function handleNumberChange(e: ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val === "") {
      onChange("");
    } else {
      const num = Number(val);
      if (!isNaN(num) && num >= 0) {
        onChange(num);
      }
    }
  }

  function handleClear() {
    onChange("");
  }

  return (
    <div className="rounded-lg border bg-background p-3.5 shadow-2xs">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-foreground">{label}</span>
        {isOverridden && (
          <Badge variant="outline" className="text-[10px]">
            Override (&gt; {prefix}
            {max.toLocaleString()})
          </Badge>
        )}
        {isBelowMin && (
          <Badge variant="outline" className="text-[10px]">
            Override (&lt; {prefix}
            {min.toLocaleString()})
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {prefix && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-muted-foreground">
              {prefix}
            </span>
          )}
          <Input
            type="number"
            min="0"
            value={numericValue}
            onChange={handleNumberChange}
            placeholder={placeholder}
            className={`w-full pr-2 text-xs ${prefix ? "pl-6" : "pl-2.5"}`}
          />
        </div>

        {unit && <span className="shrink-0 text-xs font-medium text-muted-foreground">{unit}</span>}

        {numericValue !== "" && (
          <Button
            type="button"
            size="icon-xs"
            variant="ghost"
            onClick={handleClear}
            title="Clear value"
          >
            ✕
          </Button>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {prefix}
          {min.toLocaleString()}
        </span>
        <Slider
          min={min}
          max={max}
          step={step}
          value={[Number(sliderValue || min)]}
          onValueChange={(values) =>
            onChange(Array.isArray(values) ? Number(values[0]) : Number(values))
          }
          className="w-full"
        />
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {prefix}
          {max.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
