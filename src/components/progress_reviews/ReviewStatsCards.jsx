import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, Clock, CheckCircle2, Users, TrendingDown, Zap } from "lucide-react";

export default function ReviewStatsCards({
  pendingCount,
  reviewsThisWeek,
  totalCheckIns,
  averageResponseTime,
  inactiveClients,
  onScheduleClick
}) {
  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        <div>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="text-gray-50 lucide lucide-chart-column w-8 h-8" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Progress Reviews</h1>
          </div>
          <p className="text-muted-foreground">Review client check-ins and track their progress.</p>
        </div>
        <Button
          onClick={onScheduleClick}
          className="bg-[#C5B358] hover:bg-[#A4913C] text-black font-semibold">

          <Calendar className="w-4 h-4 mr-2" />
          Schedule Check-In
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center shrink-0 ml-0.5">
                <Clock className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reviews This Week</p>
                <p className="text-3xl font-bold text-foreground">{reviewsThisWeek}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center shrink-0 ml-0.5">
                <CheckCircle2 className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Check-ins</p>
                <p className="text-3xl font-bold text-foreground">{totalCheckIns}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center shrink-0 ml-0.5">
                <Users className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response</p>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="text-3xl font-bold text-foreground mt-1">{averageResponseTime}h</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center shrink-0 ml-0.5">
                <Zap className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive Clients</p>
                <p className="text-3xl font-bold text-foreground">{inactiveClients}</p>
                <p className="text-xs text-muted-foreground mt-1">30+ days</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#C5B358] to-[#A4913C] bg-opacity-20 flex items-center justify-center shrink-0 ml-0.5">
                <TrendingDown className="w-6 h-6 text-[#C5B358]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>);

}