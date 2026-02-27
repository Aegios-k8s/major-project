import { useEffect } from "react";
import { useSecurityContext } from "@/contexts/SecurityContext";
import ScoreVisuals from "@/components/security/ScoreVisuals";
import SecurityOverview from "@/components/security/SecurityOverview";

const K8sScorePage = () => {
  const { refreshData } = useSecurityContext();

  useEffect(() => {
    // Fetch data when page loads
    refreshData();
  }, [refreshData]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">K8s Security Score</h1>
        <p className="text-muted-foreground">
          Monitor your Kubernetes cluster security posture and overall health metrics.
        </p>
      </div>

      {/* Charts Row - Only Pie and Bar */}
      <ScoreVisuals />

      {/* Divider */}
      <hr className="border-cyber-border neon-divider my-6" />

      {/* Security Overview Section */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-primary">Security Overview</h2>
        <SecurityOverview />
      </div>
    </div>
  );
};

export default K8sScorePage;