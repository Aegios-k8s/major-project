import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
const ActivitySidebar = () => {
  const activities = [{
    type: "success",
    message: "Security scan takes ",
    time: "less than 60 seconds",
    icon: CheckCircle
  }, {
    type: "info",
    message: "New policy deployed",
    time: "15 min ago",
    icon: Info
  }, {
    type: "warning",
    message: "Unusual activity detected",
    time: "1 hour ago",
    icon: AlertCircle
  }, {
    type: "success",
    message: "Backup completed",
    time: "2 hours ago",
    icon: CheckCircle
  }, {
    type: "info",
    message: "System update available",
    time: "3 hours ago",
    icon: Info
  }];
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "success":
        return "default";
      case "warning":
        return "destructive";
      case "info":
        return "secondary";
      default:
        return "default";
    }
  };
  return <Card className="h-[calc(100vh-6rem)] border-cyber-border bg-card glow-border border-double">
      <CardHeader>
        <CardTitle className="text-lg text-primary">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-4">
            {activities.map((activity, index) => {
            const Icon = activity.icon;
            return <div key={index} className="flex gap-3 p-3 rounded-lg bg-secondary border border-cyber-border hover:border-primary transition-colors">
                  <Icon className={`h-5 w-5 mt-0.5 ${activity.type === "success" ? "text-primary" : activity.type === "warning" ? "text-destructive" : "text-accent"}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground leading-tight">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>;
          })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>;
};
export default ActivitySidebar;