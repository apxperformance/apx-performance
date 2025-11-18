import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays } from "date-fns";

export default function SupplementComplianceHistory({ complianceRecords, supplementPlan }) {
  if (!supplementPlan || !supplementPlan.supplements || supplementPlan.supplements.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardContent className="p-8 text-center">
          <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No supplement plan assigned</p>
        </CardContent>
      </Card>
    );
  }

  const totalSupplements = supplementPlan.supplements.length;

  // Calculate statistics
  const stats = complianceRecords.reduce((acc, record) => {
    const compliance = (record.supplements_taken?.length || 0) / totalSupplements;
    acc.totalDays++;
    acc.totalCompliance += compliance;
    if (compliance === 1) acc.perfectDays++;
    if (compliance >= 0.8) acc.goodDays++;
    if (compliance < 0.5) acc.missedDays++;
    return acc;
  }, { totalDays: 0, totalCompliance: 0, perfectDays: 0, goodDays: 0, missedDays: 0 });

  const overallCompliance = stats.totalDays > 0 
    ? Math.round((stats.totalCompliance / stats.totalDays) * 100) 
    : 0;

  // Get last 30 days for calendar view
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date()
  });

  const getComplianceForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return complianceRecords.find(record => record.date === dateStr);
  };

  const getComplianceColor = (compliance) => {
    if (!compliance) return "bg-gray-800 border-gray-700";
    const percentage = (compliance.supplements_taken?.length || 0) / totalSupplements;
    if (percentage === 1) return "bg-[hsl(var(--success))] border-[hsl(var(--success))]";
    if (percentage >= 0.8) return "bg-[#C5B358] border-[#C5B358]";
    if (percentage >= 0.5) return "bg-[hsl(var(--warning))] border-[hsl(var(--warning))]";
    return "bg-[hsl(var(--destructive))]/50 border-[hsl(var(--destructive))]";
  };

  const getComplianceLabel = (compliance) => {
    if (!compliance) return "No data";
    const percentage = (compliance.supplements_taken?.length || 0) / totalSupplements;
    return `${compliance.supplements_taken?.length || 0}/${totalSupplements}`;
  };

  // Calculate weekly averages for last 4 weeks
  const weeklyAverages = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = startOfWeek(subDays(new Date(), i * 7));
    const weekEnd = endOfWeek(weekStart);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const weekCompliance = weekDays.map(day => {
      const record = getComplianceForDate(day);
      if (!record) return 0;
      return (record.supplements_taken?.length || 0) / totalSupplements;
    });

    const weekAvg = weekCompliance.length > 0 
      ? Math.round((weekCompliance.reduce((sum, val) => sum + val, 0) / weekCompliance.filter(v => v > 0).length || 1) * 100) 
      : 0;

    weeklyAverages.unshift({
      label: i === 0 ? "This Week" : `${i} Week${i > 1 ? 's' : ''} Ago`,
      average: weekAvg,
      days: weekCompliance.filter(v => v > 0).length
    });
  }

  // Trend analysis
  const recentWeek = weeklyAverages[weeklyAverages.length - 1]?.average || 0;
  const previousWeek = weeklyAverages[weeklyAverages.length - 2]?.average || 0;
  const trend = recentWeek - previousWeek;

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{overallCompliance}%</div>
            <div className="text-xs text-muted-foreground mt-1">Overall Compliance</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[hsl(var(--success))]">{stats.perfectDays}</div>
            <div className="text-xs text-muted-foreground mt-1">Perfect Days</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#C5B358]">{stats.goodDays}</div>
            <div className="text-xs text-muted-foreground mt-1">Good Days (≥80%)</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[hsl(var(--destructive))]">{stats.missedDays}</div>
            <div className="text-xs text-muted-foreground mt-1">Poor Days (&lt;50%)</div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis */}
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            {trend >= 0 ? (
              <TrendingUp className="w-5 h-5 text-[hsl(var(--success))]" />
            ) : (
              <TrendingDown className="w-5 h-5 text-[hsl(var(--destructive))]" />
            )}
            Compliance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Badge className={trend >= 0 ? "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" : "bg-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30"}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last week
            </Badge>
            <span className="text-sm text-muted-foreground">
              {trend > 10 && "Excellent improvement!"}
              {trend > 0 && trend <= 10 && "Slight improvement"}
              {trend === 0 && "Maintaining consistency"}
              {trend < 0 && trend >= -10 && "Slight decline"}
              {trend < -10 && "Significant decline - check in with client"}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {weeklyAverages.map((week, idx) => (
              <div key={idx} className="text-center">
                <div className="text-xs text-muted-foreground mb-2">{week.label}</div>
                <div className="h-24 bg-secondary/30 rounded-lg flex items-end justify-center p-2">
                  <div 
                    className="w-full bg-gradient-to-t from-[#C5B358] to-[#A4913C] rounded"
                    style={{ height: `${week.average}%` }}
                  />
                </div>
                <div className="text-sm font-semibold text-foreground mt-2">{week.average}%</div>
                <div className="text-xs text-muted-foreground">{week.days} days</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 30-Day Calendar View */}
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground pb-2">
                {day}
              </div>
            ))}
            {last30Days.map((date, idx) => {
              const compliance = getComplianceForDate(date);
              const isToday = isSameDay(date, new Date());
              
              return (
                <div
                  key={idx}
                  className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all hover:scale-105 ${getComplianceColor(compliance)} ${isToday ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''}`}
                  title={`${format(date, 'MMM d')}: ${getComplianceLabel(compliance)}`}
                >
                  <div className="text-xs font-semibold text-white">
                    {format(date, 'd')}
                  </div>
                  {compliance && (
                    <div className="text-[10px] text-white/90 mt-0.5">
                      {getComplianceLabel(compliance)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-6 mt-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[hsl(var(--success))] border-2 border-[hsl(var(--success))]"></div>
              <span className="text-muted-foreground">100% (Perfect)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#C5B358] border-2 border-[#C5B358]"></div>
              <span className="text-muted-foreground">80-99% (Good)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[hsl(var(--warning))] border-2 border-[hsl(var(--warning))]"></div>
              <span className="text-muted-foreground">50-79% (Fair)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[hsl(var(--destructive))]/50 border-2 border-[hsl(var(--destructive))]"></div>
              <span className="text-muted-foreground">&lt;50% (Poor)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-800 border-2 border-gray-700"></div>
              <span className="text-muted-foreground">No data</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Compliance Details */}
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Daily Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {complianceRecords.slice(0, 14).map((record, idx) => {
              const percentage = Math.round((record.supplements_taken?.length || 0) / totalSupplements * 100);
              const isComplete = percentage === 100;
              
              return (
                <div key={idx} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium text-foreground">
                        {format(new Date(record.date), 'EEEE, MMM d')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.supplements_taken?.join(', ') || 'None taken'}
                      </div>
                      {record.notes && (
                        <div className="text-xs text-muted-foreground italic mt-1">
                          "{record.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      percentage === 100 
                        ? "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30"
                        : percentage >= 80
                        ? "bg-[#C5B358]/20 text-[#C5B358] border-[#C5B358]/30"
                        : "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"
                    }>
                      {percentage}%
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {record.supplements_taken?.length || 0}/{totalSupplements}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}