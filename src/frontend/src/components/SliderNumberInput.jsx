export default function SliderNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  prefix = '',
  placeholder = 'Optional',
}) {
  const numericValue = value === '' || value === null || value === undefined ? '' : Number(value)
  const isOverridden = numericValue !== '' && numericValue > max
  const isBelowMin = numericValue !== '' && numericValue < min

  // Slider is clamped to [min, max]
  const sliderValue =
    numericValue === ''
      ? min
      : Math.min(max, Math.max(min, numericValue))

  function handleNumberChange(e) {
    const val = e.target.value
    if (val === '') {
      onChange('')
    } else {
      const num = Number(val)
      if (!isNaN(num) && num >= 0) {
        onChange(num)
      }
    }
  }

  function handleSliderChange(e) {
    onChange(Number(e.target.value))
  }

  function handleClear() {
    onChange('')
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="text-xs font-medium text-gray-700 truncate">
          {label}
        </label>
        {isOverridden && (
          <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
            Override (&gt; {prefix}{max.toLocaleString()})
          </span>
        )}
        {isBelowMin && (
          <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
            Override (&lt; {prefix}{min.toLocaleString()})
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {prefix && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-gray-400">
              {prefix}
            </span>
          )}
          <input
            type="number"
            min="0"
            value={numericValue}
            onChange={handleNumberChange}
            placeholder={placeholder}
            className={`w-full rounded-md border border-gray-300 py-1.5 pr-2 text-xs text-gray-900 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 ${
              prefix ? 'pl-6' : 'pl-2.5'
            }`}
          />
        </div>

        {unit && (
          <span className="text-xs text-gray-500 shrink-0 font-medium">
            {unit}
          </span>
        )}

        {numericValue !== '' && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear value"
            className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition shrink-0"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-[10px] text-gray-400 font-mono shrink-0">
          {prefix}{min.toLocaleString()}
        </span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={sliderValue}
          onChange={handleSliderChange}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-600 focus:outline-none"
        />
        <span className="text-[10px] text-gray-400 font-mono shrink-0">
          {prefix}{max.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

