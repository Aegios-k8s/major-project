import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Activity, Download, CheckCircle, Database, FileCode } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/api";
import { getSessionToken } from "@/lib/data-transformers";
import { useSecurityContext } from "@/contexts/SecurityContext";

const MainDashboard = () => {
  const [isLoadingFetch, setIsLoadingFetch] = useState(false);
  const [isLoadingValidation, setIsLoadingValidation] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string>("");
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [fetchProgress, setFetchProgress] = useState<string>("");
  const [validationReport, setValidationReport] = useState<any>(null);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { services, score } = useSecurityContext();

  const stats = [
    
    { 
      icon: Database, 
      label: "K8s Resources", 
      value: dashboardStats?.stats?.k8s_resources || services.length || "0", 
      color: "text-accent" 
    },
    { 
      icon: FileCode, 
      label: "Total Repositories", 
      value: dashboardStats?.stats?.total_repos || "0", 
      color: "text-primary" 
    },
    
  ];

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      const sessionToken = getSessionToken();
      if (!sessionToken) return;

      try {
        const response = await fetch(API_CONFIG.ENDPOINTS.FETCHING.DASHBOARD, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken }),
        });

        const result = await response.json();
        if (result.success) {
          setDashboardStats(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, [services, score]);

  // Handle scroll navigation based on URL path
  useEffect(() => {
    if (location.pathname.includes('fetch-data')) {
      const element = document.getElementById('fetch-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHighlightedSection('fetch');
        setTimeout(() => {
          setHighlightedSection(null);
        }, 2000);
      }
    } else if (location.pathname.includes('validation')) {
      const element = document.getElementById('validation-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHighlightedSection('validation');
        setTimeout(() => {
          setHighlightedSection(null);
        }, 2000);
      }
    }
  }, [location.pathname]);

  const handleFetchData = async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      toast.error('Please login first');
      return;
    }

    setIsLoadingFetch(true);
    setFetchProgress('Initializing GitHub scan...');
    console.log('🔄 Triggering fetch data...');

    try {
      setFetchProgress('Fetching repositories from GitHub...');
      
      const response = await fetch(API_CONFIG.ENDPOINTS.FETCHING.FETCH_DATA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken }),
      });

      const result = await response.json();
      console.log('📦 Fetch data response:', result);

      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to fetch data');
      }

      setFetchProgress('Scan completed successfully!');
      
      // Show detailed results
      const data = result.data;
      toast.success(
        `Fetched ${data.total_repos} repositories, scanned ${data.scanned_files} files, found ${data.k8s_resources} K8s resources`,
        { duration: 5000 }
      );
      
      console.log('✅ Fetch completed:', data);
      
      // Trigger security data refresh
      window.dispatchEvent(new Event('aegios:login'));
      
      // Clear progress after 3 seconds
      setTimeout(() => setFetchProgress(''), 3000);
    } catch (error) {
      console.error('❌ Fetch data error:', error);
      setFetchProgress('');
      toast.error(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setIsLoadingFetch(false);
    }
  };

  const handleValidation = async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
      toast.error('Please login first');
      return;
    }

    setIsLoadingValidation(true);
    setValidationReport(null);
    console.log('🔄 Triggering validation...');

    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.FETCHING.VALIDATION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: sessionToken }),
      });

      const result = await response.json();
      console.log('📦 Validation response:', result);

      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to run validation');
      }

      // Store validation report for display
      setValidationReport(result.data);
      
      toast.success(result.message || 'Validation completed successfully');
      console.log('✅ Validation completed:', result.data);
    } catch (error) {
      console.error('❌ Validation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to run validation');
    } finally {
      setIsLoadingValidation(false);
    }
  };

  const handleFeatureSelect = (value: string) => {
    setSelectedFeature(value);
    
    // Navigate to the selected security feature
    switch (value) {
      case 'score':
        navigate('/security-service/k8s-score');
        break;
      case 'posture':
        navigate('/security-service/k8s-posture');
        break;
      case 'actions':
        navigate('/security-service/k8s-action');
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* About Section */}
      <Card className="border-cyber-border bg-card hover:border-green-500/50 transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-2xl text-green-muted">Welcome to Aegios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-relaxed text-[hsl(var(--text-green-muted))]">
            Aegios is a cutting-edge cybersecurity platform designed to protect your Kubernetes infrastructure 
            from emerging threats. We provide real-time monitoring, automated threat detection, and comprehensive 
            security scoring to ensure your systems remain secure.
          </p>
          <p className="leading-relaxed text-[hsl(var(--text-green-muted))]">
            Our platform combines advanced AI-powered analytics with industry best practices to deliver 
            unparalleled protection for cloud-native applications. Monitor your security posture, 
            respond to threats instantly, and maintain compliance with ease.
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-cyber-border bg-card hover:border-green-500/50 transition-all duration-300">
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`p-3 rounded-lg bg-secondary ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Management Section */}
      <Card 
        id="fetch-section" 
        className={`border-cyber-border bg-card hover:border-[#29A35C]/50 transition-all duration-700 ${
          highlightedSection === 'fetch' 
            ? 'ring-2 ring-[#29A35C] shadow-[0_0_20px_rgba(41,163,92,0.25)] scale-[1.02]' 
            : ''
        }`}
      >
        <CardHeader>
          <CardTitle className="text-xl text-green-muted">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Fetch GitHub Data */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-green-muted">Fetch GitHub Data</h3>
            <p className="text-sm text-muted-foreground">
              Scan your GitHub repositories and extract Kubernetes resources for security analysis.
            </p>
            <Button 
              onClick={handleFetchData}
              disabled={isLoadingFetch}
              className="w-full"
              variant="default"
            >
              <Download className="mr-2 h-4 w-4" />
              {isLoadingFetch ? 'Fetching Data...' : 'Fetch Data'}
            </Button>
            
            {/* Progress Indicator */}
            {fetchProgress && (
              <div className="mt-3 p-3 bg-secondary/50 rounded-md border border-green-500/30">
                <p className="text-sm text-green-muted animate-pulse">
                  {fetchProgress}
                </p>
              </div>
            )}
          </div>

          {/* Security Features */}
          <div className="space-y-3 pt-4 border-t border-cyber-border">
            <h3 className="text-lg font-semibold text-green-muted">Security Features</h3>
            <p className="text-sm text-muted-foreground">
              Select a security feature to interact with your Kubernetes resources.
            </p>
            <Select value={selectedFeature} onValueChange={handleFeatureSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a security feature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Interact with K8s Score</SelectItem>
                <SelectItem value="posture">Interact with K8s Posture</SelectItem>
                <SelectItem value="actions">Interact with K8s Action</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </CardContent>
      </Card>

      {/* Validation Section - Separate */}
      <Card 
        id="validation-section" 
        className={`border-cyber-border bg-card hover:border-[#29A35C]/50 transition-all duration-700 ${
          highlightedSection === 'validation' 
            ? 'ring-2 ring-[#29A35C] shadow-[0_0_20px_rgba(41,163,92,0.25)] scale-[1.02]' 
            : ''
        }`}
      >
        <CardHeader>
          <CardTitle className="text-xl text-green-muted">Run Validation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Perform vulnerability detection and security validation on your resources.
          </p>
          <Button 
            onClick={handleValidation}
            disabled={isLoadingValidation}
            className="w-full"
            variant="default"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isLoadingValidation ? 'Running Validation...' : 'Validation'}
          </Button>
          
          {/* Validation Report */}
          {validationReport && (
            <div className="mt-3 p-4 bg-secondary/50 rounded-md border border-green-500/30 space-y-3">
              <h4 className="font-semibold text-green-muted">Validation Report</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2 text-green-muted font-medium">
                    {validationReport.status || 'Completed'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Resources Scanned:</span>
                  <span className="ml-2 text-green-muted font-medium">
                    {validationReport.total_resources || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Issues:</span>
                  <span className="ml-2 text-amber-400 font-medium">
                    {validationReport.vulnerabilities_found || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Critical:</span>
                  <span className="ml-2 text-red-500 font-medium">
                    {validationReport.summary?.critical || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">High:</span>
                  <span className="ml-2 text-orange-500 font-medium">
                    {validationReport.summary?.high || 0}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Medium:</span>
                  <span className="ml-2 text-yellow-500 font-medium">
                    {validationReport.summary?.medium || 0}
                  </span>
                </div>
              </div>
              {validationReport.vulnerabilities && validationReport.vulnerabilities.length > 0 && (
                <div className="mt-3 pt-3 border-t border-primary/20">
                  <p className="text-xs text-muted-foreground mb-2">
                    Top Issues Found:
                  </p>
                  <ul className="text-xs space-y-1">
                    {validationReport.vulnerabilities.slice(0, 3).map((vuln: any, idx: number) => (
                      <li key={idx} className="text-muted-foreground">
                        • {vuln.title} ({vuln.kind}: {vuln.resource_name})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MainDashboard;
