import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { K8sPostureFinding } from "@/types/security";

interface ActionCardProps {
  finding: K8sPostureFinding;
  onApply: (finding: K8sPostureFinding, command: string) => Promise<{ success: boolean; message: string }>;
}

const severityToStatus = (severity: string): "Low" | "High" | "Critical" => {
  const normalized = (severity || "").toLowerCase();
  if (normalized === "critical") return "Critical";
  if (normalized === "high") return "High";
  return "Low";
};

const statusClassMap: Record<string, string> = {
  Critical: "bg-[#FF0000]/20 text-[#FF0000] border-[#FF0000]",
  High: "bg-yellow-500/20 text-yellow-500 border-yellow-500",
  Low: "bg-orange-500/20 text-orange-500 border-orange-500",
};

const ActionCard = ({ finding, onApply }: ActionCardProps) => {
  const [isApplying, setIsApplying] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const status = severityToStatus(finding.severity);

  const currentPorts = useMemo(() => {
    const matches = `${finding.description || ""} ${finding.recommendation || ""}`.match(/\b\d{2,5}\b/g) || [];
    const ports = matches
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0 && value <= 65535);
    return Array.from(new Set(ports));
  }, [finding.description, finding.recommendation]);

  const issueType = (finding.issue_type || "").toLowerCase();
  const checkName = (finding.check_name || "").toLowerCase();
  const kind = (finding.kind || finding.missing_kind || "").toLowerCase();
  const shouldShowPorts = currentPorts.length > 0 && (
    issueType === "container-port" ||
    checkName.includes("service exposure") ||
    kind === "service"
  );

  const handleApply = async () => {
    if (isApplying) return;

    setIsApplying(true);
    setResultMessage(null);

    try {
      const result = await onApply(finding, "remediate");
      setResultMessage(result.message);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className="border-cyber-border bg-card glow-border transition-colors hover:border-primary">
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Namespace</p>
            <p className="text-sm font-medium text-foreground">{finding.namespace || "default"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
            <p className="text-sm font-semibold text-primary">{finding.name || finding.kind || "Unknown"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Labels</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge className="text-xs neon-badge">kind: {finding.kind || finding.missing_kind || "unknown"}</Badge>
              {finding.repo_name && (
                <Badge className="text-xs neon-badge">repo: {finding.repo_name}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Badge className={`flex items-center gap-1 w-fit border ${statusClassMap[status]}`}>
            {status}
          </Badge>
        </div>

        <div className="rounded-lg border border-primary/40 bg-secondary/10 p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Config</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{finding.description || "No issue details available."}</p>
          {shouldShowPorts && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Exposed Ports:</p>
              <div className="flex flex-wrap gap-2">
                {currentPorts.map((port) => (
                  <span 
                    key={port}
                    className="text-lg font-bold text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1"
                  >
                    {port}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-primary/40 bg-secondary/10 p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommendation</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{finding.recommendation || "No recommendation provided."}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            Raise PR
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            View Actions
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isApplying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Remediate
          </Button>
        </div>

        {resultMessage && (
          <div className="flex items-center gap-2 text-sm text-primary border border-primary/40 rounded-lg p-3 bg-secondary/10 mt-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{resultMessage}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionCard;
