import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LabResult } from "@shared/schema";

interface LabTrendsProps {
  labResults: LabResult[];
  testName: string;
  normalRange?: {
    min: number;
    max: number;
  };
}

export default function LabTrends({ labResults, testName, normalRange }: LabTrendsProps) {
  const chartData = useMemo(() => {
    return labResults
      .filter(result => result.testName === testName && result.result && result.resultDate)
      .sort((a, b) => new Date(a.resultDate!).getTime() - new Date(b.resultDate!).getTime())
      .map(result => {
        const numericValue = parseFloat(result.result!);
        return {
          date: new Date(result.resultDate!).toLocaleDateString(),
          value: isNaN(numericValue) ? null : numericValue,
          status: result.status,
          fullDate: result.resultDate,
        };
      })
      .filter(item => item.value !== null);
  }, [labResults, testName]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "hsl(var(--success))";
      case "abnormal":
        return "hsl(var(--warning))";
      case "critical":
        return "hsl(var(--destructive))";
      default:
        return "hsl(var(--muted-foreground))";
    }
  };

  const getLatestStatus = () => {
    if (chartData.length === 0) return null;
    const latest = chartData[chartData.length - 1];
    return latest.status;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "normal":
        return <Badge className="lab-normal">Normal</Badge>;
      case "abnormal":
        return <Badge className="lab-abnormal">Abnormal</Badge>;
      case "critical":
        return <Badge className="lab-critical">Critical</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (chartData.length === 0) {
    return (
      <Card data-testid={`lab-trends-${testName.toLowerCase().replace(/\s+/g, '-')}`}>
        <CardHeader>
          <CardTitle className="text-base">{testName} Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No data available for trending</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid={`lab-trends-${testName.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{testName} Trends</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Latest:</span>
            {getStatusBadge(getLatestStatus() || "unknown")}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: any, name: string) => [
                  value,
                  "Value"
                ]}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              
              {/* Normal range reference lines */}
              {normalRange && (
                <>
                  <ReferenceLine 
                    y={normalRange.min} 
                    stroke="hsl(var(--success))" 
                    strokeDasharray="2 2"
                    label={{ value: "Normal Min", position: "topLeft" }}
                  />
                  <ReferenceLine 
                    y={normalRange.max} 
                    stroke="hsl(var(--success))" 
                    strokeDasharray="2 2"
                    label={{ value: "Normal Max", position: "topLeft" }}
                  />
                </>
              )}
              
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={(props: any) => {
                  const { payload, cx, cy } = props;
                  if (!payload) return null;
                  
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={getStatusColor(payload.status)}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ 
                  r: 6, 
                  fill: "hsl(var(--primary))",
                  stroke: "#fff",
                  strokeWidth: 2
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {normalRange && (
          <div className="mt-4 text-xs text-muted-foreground">
            <p>Normal Range: {normalRange.min} - {normalRange.max}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
