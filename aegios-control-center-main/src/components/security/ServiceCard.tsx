import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/types/security";
import { useNavigate } from "react-router-dom";
import { ExternalLink, AlertTriangle, AlertCircle } from "lucide-react";

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const navigate = useNavigate();
  const issueType = typeof service.metadata?.issue_type === 'string' ? service.metadata.issue_type.toLowerCase() : '';
  const ownerText = typeof service.metadata?.owner === 'string' ? service.metadata.owner.toLowerCase() : '';
  const kindLabel = typeof service.labels?.kind === 'string' ? service.labels.kind.toLowerCase() : '';
  const shouldShowPorts = service.ports.length > 0 && (
    issueType === 'container-port' ||
    ownerText.includes('service exposure') ||
    kindLabel === 'service'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Low':
        return 'bg-orange-500/20 text-orange-500 border-orange-500';
      case 'High':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500';
      case 'Critical':
        return 'bg-[#FF0000]/20 text-[#FF0000] border-[#FF0000]';
      default:
        return 'bg-muted/20 text-muted-foreground border-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Low':
        return <AlertTriangle className="h-4 w-4" />;
      case 'High':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Critical':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleViewActions = () => {
    const issueType = typeof service.metadata?.issue_type === 'string'
      ? service.metadata.issue_type.toLowerCase()
      : '';

    const categoryMap: Record<string, string> = {
      'container-port': 'service-port',
      'pod': 'resource-limit',
      'container-image': 'container-security',
    };

    const category = categoryMap[issueType] || issueType;

    if (category) {
      navigate(`/security/k8s-action/${category}`);
      return;
    }

    navigate('/security/k8s-action');
  };

  return (
    <Card className="border-cyber-border bg-card glow-border ">
      <CardContent className="p-6">
        {/* Three Horizontal Boxes */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Box A - Composite Meta (40% width) */}
          <div className="flex-1 lg:flex-[2] p-4 rounded-lg bg-secondary/30 border border-primary">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Namespace</p>
                <p className="text-sm font-medium text-foreground">{service.namespace}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                <p className="text-lg font-semibold text-primary ">{service.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Labels</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(service.labels).map(([key, value]) => (
                    <Badge 
                      key={key} 
                      className="text-xs neon-badge"
                    >
                      {key}: {value}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Status</p>
                <Badge className={`${getStatusColor(service.status)} flex items-center gap-1 w-fit`}>
                  {getStatusIcon(service.status)}
                  {service.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Box B - Current Config (30% width) */}
          <div className="flex-1 p-4 rounded-lg bg-secondary/30 border border-primary">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Current Config</p>
              {shouldShowPorts && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Exposed Ports:</p>
                  <div className="flex flex-wrap gap-2">
                    {service.ports.map((port) => (
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
              {service.metadata.owner && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Owner</p>
                  <p className="text-sm text-foreground">{service.metadata.owner}</p>
                </div>
              )}
            </div>
          </div>

          {/* Box C - Recommendations (30% width) */}
          <div className="flex-1 p-4 rounded-lg bg-secondary/30 border border-primary">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Recommendations</p>
              <div>
                {service.recommendations.length > 0 ? (
                  <ul className="space-y-2">
                    {service.recommendations.map((recommendation, index) => (
                      <li 
                        key={index}
                        className="text-sm text-destructive flex items-start gap-2"
                      >
                        <span className="text-destructive mt-1">•</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-primary">No recommendations - service is secure</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom - View Actions Button */}
        <div className="pt-4 border-t border-cyber-border">
          <Button 
            onClick={handleViewActions}
            variant="outline"
            className="w-full lg:w-auto border-primary text-primary hover:bg-primary/10 hover:text-primary bg-transparent"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Actions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceCard;