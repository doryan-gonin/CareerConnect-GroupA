import { useEffect, useMemo, useState } from "react";
import type { ReactNode, ChangeEvent } from "react";
import { getAnalytics, type AnalyticsEndpoint, type AnalyticsParams } from "../api/analytics";
import type { AnalyticsGranularity, AnalyticsResponseByEndpoint } from "../api/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Skeleton } from "./ui/skeleton";

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

// Each card owns its period and granularity so every graph can be adjusted on its own.
type AnalyticsCardProps<E extends AnalyticsEndpoint> = {
  token: string;
  title: string;
  endpoint: E;
  hasGranularity?: boolean;
  children: (data: AnalyticsResponseByEndpoint[E]) => ReactNode;
};
type AnalyticsResult<T> =
  | { status: "success"; requestKey: string; data: T }
  | { status: "error"; requestKey: string; error: string };

function AnalyticsCard<E extends AnalyticsEndpoint>({
  token,
  title,
  endpoint,
  hasGranularity = false,
  children,
}: AnalyticsCardProps<E>) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(() => toDateInputValue(new Date()));
  const [groupBy, setGroupBy] = useState<AnalyticsGranularity>("day");
  const [result, setResult] = useState<AnalyticsResult<AnalyticsResponseByEndpoint[E]> | null>(
    null,
  );

  let inputError = "";
  if (!startDate || !endDate) inputError = "Choose a start and end date.";
  else if (startDate > endDate) inputError = "The start date cannot be after the end date.";

  const params = useMemo<AnalyticsParams>(
    () => ({
      start_date: startDate,
      end_date: endDate,
      ...(hasGranularity ? { group_by: groupBy } : {}),
    }),
    [endDate, groupBy, hasGranularity, startDate],
  );
  const requestKey = JSON.stringify(params);
  const isCurrent = result?.requestKey === requestKey;
  const data = isCurrent && result?.status === "success" ? result.data : null;
  const error = inputError || (isCurrent && result?.status === "error" ? result.error : "");
  const isLoading = !inputError && !isCurrent;

  useEffect(() => {
    if (inputError) return undefined;
    let isMounted = true;

    getAnalytics(token, endpoint, params)
      .then((body) => {
        if (isMounted) setResult({ status: "success", requestKey, data: body });
      })
      .catch((err) => {
        if (isMounted) {
          setResult({
            status: "error",
            requestKey,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [endpoint, inputError, params, requestKey, token]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            aria-label={`${title} start date`}
            value={startDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">to</span>
          <Input
            type="date"
            aria-label={`${title} end date`}
            value={endDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
          />
          {hasGranularity && (
            <Select
              aria-label={`${title} granularity`}
              value={groupBy}
              onValueChange={(value) => {
                if (value === "day" || value === "week" || value === "month") setGroupBy(value);
              }}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">By day</SelectItem>
                <SelectItem value="week">By week</SelectItem>
                <SelectItem value="month">By month</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isLoading && (
          <div className="flex flex-col gap-3 py-12" aria-label="Loading analytics">
            <Skeleton className="h-40 w-full" />
          </div>
        )}
        {data ? children(data) : null}
      </CardContent>
    </Card>
  );
}

export default AnalyticsCard;
