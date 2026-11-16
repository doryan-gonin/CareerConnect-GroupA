type Props = { total: number; active: number; closed: number };
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "cn";

export default function RecruiterStats({ total, active, closed }: Props) {
  const cards = [
    { label: "Total Jobs", value: total, className: "" },
    { label: "Active Jobs", value: active, className: "text-primary" },
    { label: "Closed Jobs", value: closed, className: "text-muted-foreground" },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className={cn("text-2xl font-semibold", card.className)}>
              {card.value}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
