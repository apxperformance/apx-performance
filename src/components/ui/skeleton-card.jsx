import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SkeletonCard({ variant = "default" }) {
  if (variant === "stat-card") {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-secondary rounded w-1/2 animate-pulse"></div>
              <div className="h-8 bg-secondary rounded w-1/3 animate-pulse"></div>
            </div>
            <div className="w-12 h-12 bg-secondary rounded-xl animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border">
      <CardHeader>
        <div className="h-6 bg-secondary rounded w-1/2 animate-pulse"></div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-4 bg-secondary rounded animate-pulse"></div>
        <div className="h-4 bg-secondary rounded w-3/4 animate-pulse"></div>
        <div className="h-10 bg-secondary rounded animate-pulse"></div>
      </CardContent>
    </Card>
  );
}