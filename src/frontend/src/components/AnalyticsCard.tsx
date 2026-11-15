import { useEffect, useState } from "react";
import type { ReactNode, ChangeEvent } from "react";
import { getAnalytics } from "../api/analytics";
import type { AnalyticsGranularity, AnalyticsResponse } from "../api/types";

const DEFAULT_RANGE_DAYS = 30;

function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - DEFAULT_RANGE_DAYS);
  return toDateInputValue(date);
}

const inputClass =
  "rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500";

// Each card owns its period and granularity so every graph can be adjusted on its own.
export type AnalyticsPayload = AnalyticsResponse & Record<string, any>;
type AnalyticsCardProps = {
  token: string;
  title: string;
  endpoint: string;
  hasGranularity?: boolean;
  children: (data: AnalyticsPayload) => ReactNode;
};
type AnalyticsResult = { requestKey: string; data: AnalyticsPayload; error: string };

function AnalyticsCard({
  token,
  title,
  endpoint,
  hasGranularity = false,
  children,
}: AnalyticsCardProps) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [groupBy, setGroupBy] = useState<AnalyticsGranularity>("day");
  const [result, setResult] = useState<AnalyticsResult | null>(null);

  let inputError = "";
  if (!startDate || !endDate) inputError = "Choose a start and end date.";
  else if (startDate > endDate) inputError = "The start date cannot be after the end date.";

  const params = {
    start_date: startDate,
    end_date: endDate,
    ...(hasGranularity ? { group_by: groupBy } : {}),
  };
  const requestKey = JSON.stringify(params);
  const isCurrent = result?.requestKey === requestKey;
  const data = isCurrent ? result.data : null;
  const error = inputError || (isCurrent ? result.error : "");
  const isLoading = !inputError && !isCurrent;

  useEffect(() => {
    if (inputError) return undefined;
    let isMounted = true;

    getAnalytics(token, endpoint, JSON.parse(requestKey))
      .then((body) => {
        if (isMounted) setResult({ requestKey, data: body as AnalyticsPayload, error: "" });
      })
      .catch((err) => {
        if (isMounted) {
          setResult({
            requestKey,
            data: {} as AnalyticsPayload,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, endpoint, requestKey, inputError]);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-gray-900">{title}</h2>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          aria-label={`${title} start date`}
          value={startDate}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
          className={inputClass}
        />
        <span className="text-sm text-gray-500">to</span>
        <input
          type="date"
          aria-label={`${title} end date`}
          value={endDate}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
          className={inputClass}
        />
        {hasGranularity && (
          <select
            aria-label={`${title} granularity`}
            value={groupBy}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setGroupBy(e.target.value as AnalyticsGranularity)
            }
            className={inputClass}
          >
            <option value="day">By day</option>
            <option value="week">By week</option>
            <option value="month">By month</option>
          </select>
        )}
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {isLoading && <div className="py-12 text-center text-sm text-gray-500">Loading…</div>}
      {data && children(data)}
    </section>
  );
}

export default AnalyticsCard;
