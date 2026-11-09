import { useState } from 'react'

function parsePeriod(period) {
  const [year, month, day] = period.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatPeriod(period, groupBy) {
  const options = groupBy === 'month' ? { month: 'short', year: 'numeric' } : { month: 'short', day: 'numeric' }
  return parsePeriod(period).toLocaleDateString(undefined, options)
}

function formatTooltipPeriod(period, groupBy) {
  const date = parsePeriod(period).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
    ...(groupBy === 'month' ? {} : { day: 'numeric' }),
  })
  return `${groupBy === 'week' ? 'Week of ' : ''}${date}`
}

function AnalyticsBarChart({ points, groupBy, valueKey, unit }) {
  const [hovered, setHovered] = useState(null)
  const maxValue = Math.max(0, ...points.map((point) => point[valueKey]))

  if (maxValue === 0) {
    return <div className="rounded-md bg-gray-50 py-12 text-center text-sm text-gray-500">No {unit} in this period.</div>
  }

  const step = Math.max(1, Math.ceil(maxValue / 4))
  const top = Math.ceil(maxValue / step) * step
  const ticks = Array.from({ length: top / step + 1 }, (_, index) => index * step)
  const count = points.length
  const labelStep = Math.ceil(count / (groupBy === 'month' ? 4 : 5))
  const hoveredPoint = hovered === null ? null : points[hovered]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative h-40 w-6 shrink-0" aria-hidden="true">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 translate-y-1/2 text-xs text-gray-500"
              style={{ bottom: `${(tick / top) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="img"
            aria-label={`Bar chart of ${unit} per ${groupBy}. The peak is ${maxValue}.`}
            className="relative h-40 border-b border-gray-300"
            onMouseLeave={() => setHovered(null)}
          >
            {ticks.slice(1).map((tick) => (
              <div
                key={tick}
                className="absolute w-full border-t border-gray-100"
                style={{ bottom: `${(tick / top) * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 flex" style={{ gap: count > 60 ? 0 : 2 }}>
              {points.map((point, index) => (
                <div
                  key={point.period}
                  className="flex h-full min-w-0 flex-1 items-end justify-center"
                  onMouseEnter={() => setHovered(index)}
                >
                  <div
                    className={`w-full max-w-10 rounded-t ${hovered === index ? 'bg-purple-800' : 'bg-purple-600'}`}
                    style={{ height: `${(point[valueKey] / top) * 100}%` }}
                  />
                </div>
              ))}
            </div>

            {hoveredPoint && (
              <div
                className="pointer-events-none absolute top-0 z-10 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white"
                style={{
                  left: `${((hovered + 0.5) / count) * 100}%`,
                  transform: `translateX(${hovered < count / 3 ? '0' : hovered > (2 * count) / 3 ? '-100%' : '-50%'})`,
                }}
              >
                {formatTooltipPeriod(hoveredPoint.period, groupBy)}: {hoveredPoint[valueKey]} {unit}
              </div>
            )}
          </div>

          <div className="relative mt-1 h-4" aria-hidden="true">
            {points.map((point, index) =>
              index % labelStep === 0 ? (
                <span
                  key={point.period}
                  className="absolute text-xs whitespace-nowrap text-gray-500"
                  style={
                    index === 0
                      ? { left: 0 }
                      : { left: `${((index + 0.5) / count) * 100}%`, transform: 'translateX(-50%)' }
                  }
                >
                  {formatPeriod(point.period, groupBy)}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>

      <details className="text-sm text-gray-600">
        <summary className="cursor-pointer text-xs font-medium text-purple-600">View data</summary>
        <div className="mt-2 max-h-48 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-gray-500">
                <th className="py-1 font-medium">Period</th>
                <th className="py-1 font-medium capitalize">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.period} className="border-t border-gray-100">
                  <td className="py-1">{formatTooltipPeriod(point.period, groupBy)}</td>
                  <td className="py-1">{point[valueKey]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

export default AnalyticsBarChart
