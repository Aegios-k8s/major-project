import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  Critical: "bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/50",
  High: "bg-yellow-500/10 text-yellow-500 border-yellow-500/50",
  Low: "bg-orange-500/10 text-orange-500 border-orange-500/50",
};

const ActionCard = ({ finding, onApply }: ActionCardProps) => {
  const [command, setCommand] = useState("");
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
    const trimmedCommand = command.trim();
    if (!trimmedCommand || isApplying) return;

    setIsApplying(true);
    setResultMessage(null);

    try {
      const result = await onApply(finding, trimmedCommand);
      setResultMessage(result.message);
      if (result.success) {
        setCommand("");
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card className="border-cyber-border bg-card glow-border transition-colors hover:border-primary">
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-green-500/80">Namespace</p>
            <p className="text-sm text-green-200">{finding.namespace || "default"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-green-500/80">Name</p>
            <p className="text-sm text-green-200">{finding.name || finding.kind || "Unknown"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-green-500/80">Labels</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge className="bg-green-500/10 text-green-300 border border-green-500/40">kind: {finding.kind || finding.missing_kind || "unknown"}</Badge>
              {finding.repo_name && (
                <Badge className="bg-green-500/10 text-green-300 border border-green-500/40">repo: {finding.repo_name}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-green-500/80">Status:</span>
          <Badge className={`border ${statusClassMap[status]}`}>{status}</Badge>
        </div>

        <div className="rounded-lg border border-green-500/40 bg-green-500/5 p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-green-500/80">Current Config</p>
          <p className="text-sm text-green-200">{finding.description || "No issue details available."}</p>
          {shouldShowPorts && (
            <p className="text-sm text-green-300">Exposed Ports: {currentPorts.join(", ")}</p>
          )}
        </div>

        <div className="rounded-lg border border-green-500/40 bg-green-500/5 p-4 space-y-2">
          <p className="text-xs uppercase tracking-wide text-green-500/80">Recommendation</p>
          <p className="text-sm text-green-200">{finding.recommendation || "No recommendation provided."}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <Input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Type your command or fix"
            className="bg-black border-green-500/50 text-green-200 placeholder:text-green-700 focus-visible:ring-green-500"
          />
          <Button
            onClick={handleApply}
            disabled={!command.trim() || isApplying}
            className="bg-green-600 hover:bg-green-500 text-black font-semibold min-w-28"
          >
            {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </Button>
        </div>

        {resultMessage && (
          <div className="flex items-center gap-2 text-sm text-green-300 border border-green-500/40 rounded-lg p-3 bg-green-500/5">
            <CheckCircle2 className="h-4 w-4" />
            <span>{resultMessage}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionCard;
