import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, Info, WifiOff } from "lucide-react";
import { useSecurityContext } from "@/contexts/SecurityContext";

const RightSidebar = () => {
  const { isConnected } = useSecurityContext();

  const activities = [
    {
      type: "success",
      message: "Security scan completed",
      time: "2 min ago",
      icon: CheckCircle
    },
    {
      type: "info", 
      message: "New policy deployed",
      time: "15 min ago",
      icon: Info
    },
    {
      type: "warning",
      message: "Unusual activity detected", 
      time: "1 hour ago",
      icon: AlertCircle
    },
    {
      type: "success",
      message: "Backup completed",
      time: "2 hours ago", 
      icon: CheckCircle
    },
    {
      type: "info",
      message: "System update available",
      time: "3 hours ago",
      icon: Info
    }
  ];

  return (
    <Card className="h-full border-cyber-border bg-card glow-border border-double">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-primary glow-text">Recent Activity</CardTitle>
          {!isConnected && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <WifiOff className="h-3 w-3" />
              <span>Disconnected</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div 
                  key={index} 
                  className="flex gap-3 p-3 rounded-lg bg-secondary border border-cyber-border hover:border-primary transition-colors"
                >
                  <Icon className={`h-5 w-5 mt-0.5 ${
                    activity.type === "success" 
                      ? "text-primary" 
                      : activity.type === "warning" 
                      ? "text-destructive" 
                      : "text-accent"
                  }`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground leading-tight">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RightSidebar;