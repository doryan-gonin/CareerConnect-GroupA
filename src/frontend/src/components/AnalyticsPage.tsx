import AnalyticsBarChart from "./AnalyticsBarChart";
import AnalyticsCard from "./AnalyticsCard";
import ApplicationsSection from "./ApplicationsSection";
import { Button } from "./ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";
import type {
  AnalyticsPoint,
  ApplicationAnalyticsResponse,
  SalaryDistributionResponse,
  SearchAnalyticsResponse,
  ViewAnalyticsPoint,
  ViewAnalyticsResponse,
} from "../api/types";

const PERIOD_CHARTS = [
  { title: "Searches", endpoint: "searches", valueKey: "count", unit: "searches" },
  { title: "Applications", endpoint: "applications", valueKey: "count", unit: "applications" },
  {
    title: "Viewed postings",
    endpoint: "views",
    valueKey: "unique_postings",
    unit: "postings viewed",
  },
] as const;

function formatSalary(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

// The backend returns summary numbers rather than individual salaries, so this
// shows the spread (min, average, one standard deviation, max) instead of a histogram.
function SalaryDistribution({ data }: { data: SalaryDistributionResponse }) {
  if (data.salary_count === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No salary data</EmptyTitle>
          <EmptyDescription>No applications with a listed salary in this period.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const min = data.minimum_salary ?? 0;
  const max = data.maximum_salary ?? min;
  const average = data.average_salary ?? min;
  const deviation = data.standard_deviation ?? 0;
  const position = (value: number) => (max === min ? 50 : ((value - min) / (max - min)) * 100);
  const bandStart = position(Math.max(min, average - deviation));
  const bandEnd = position(Math.min(max, average + deviation));
  const averagePosition = position(average);

  return (
    <div className="flex flex-col gap-4">
      {max > min && (
        <div
          role="img"
          aria-label={`Salaries range from ${formatSalary(min)} to ${formatSalary(max)}, averaging ${formatSalary(average)}.`}
          className="px-1 pt-6"
        >
          <div className="relative h-2 rounded-full bg-muted">
            <div
              className="absolute h-2 rounded-full bg-primary/40"
              style={{ left: `${bandStart}%`, width: `${bandEnd - bandStart}%` }}
            />
            <div
              className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded bg-primary"
              style={{ left: `${averagePosition}%` }}
            />
            <span
              className="absolute -top-6 text-xs font-medium whitespace-nowrap"
              style={{
                left: `${averagePosition}%`,
                transform: `translateX(${averagePosition < 20 ? "0" : averagePosition > 80 ? "-100%" : "-50%"})`,
              }}
            >
              Average {formatSalary(average)}
            </span>
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{formatSalary(min)}</span>
            <span>{formatSalary(max)}</span>
          </div>
        </div>
      )}

      {max === min && <p className="text-2xl font-semibold">{formatSalary(average)}</p>}

      <p className="text-xs text-muted-foreground">
        Based on the midpoint salary of {data.salary_count} application
        {data.salary_count === 1 ? "" : "s"}.
        {max > min &&
          ` The shaded band is one standard deviation (${formatSalary(deviation)}) around the average.`}
      </p>
    </div>
  );
}

type TrendAnalyticsResponse =
  | ApplicationAnalyticsResponse
  | SearchAnalyticsResponse
  | ViewAnalyticsResponse;

type ChartPoint = { period: string; count: number };

function toChartPoints(data: TrendAnalyticsResponse): ChartPoint[] {
  return data.points.map((point: AnalyticsPoint | ViewAnalyticsPoint) => ({
    period: point.period,
    count: "count" in point ? point.count : point.unique_postings,
  }));
}

function SummaryStat({
  label,
  value,
  count,
}: {
  label: string;
  value?: string | null;
  count: number;
}) {
  return (
    <div className="flex-1 rounded-md bg-muted/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold">{value ?? "No applications"}</p>
      {value && (
        <p className="text-xs text-muted-foreground">
          {count} application{count === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

function AnalyticsPage({ token, onBack }: { token: string; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <Button
        type="button"
        variant="link"
        onClick={onBack}
        className="self-start px-0 text-sm font-medium"
      >
        ← Back to dashboard
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          See how your job search is going. Each graph has its own period.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {PERIOD_CHARTS.map((chart) => (
          <AnalyticsCard
            key={chart.endpoint}
            token={token}
            title={chart.title}
            endpoint={chart.endpoint}
            hasGranularity
          >
            {(data) => (
              <AnalyticsBarChart
                points={toChartPoints(data)}
                groupBy={data.group_by}
                valueKey={chart.valueKey}
                unit={chart.unit}
              />
            )}
          </AnalyticsCard>
        ))}

        <AnalyticsCard
          token={token}
          title="Salary distribution of applied positions"
          endpoint="salary-distribution"
        >
          {(data) => <SalaryDistribution data={data} />}
        </AnalyticsCard>

        <div className="lg:col-span-2">
          <AnalyticsCard token={token} title="Where you apply most" endpoint="application-summary">
            {(data) => (
              <div className="flex flex-col gap-3 sm:flex-row">
                <SummaryStat
                  label="Most frequent category"
                  value={data.category}
                  count={data.category_count}
                />
                <SummaryStat
                  label="Most common location"
                  value={data.location}
                  count={data.location_count}
                />
              </div>
            )}
          </AnalyticsCard>
        </div>
      </div>

      <ApplicationsSection token={token} />
    </div>
  );
}

export default AnalyticsPage;
