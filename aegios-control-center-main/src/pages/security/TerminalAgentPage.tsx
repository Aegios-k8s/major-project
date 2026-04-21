import { useState, useRef, useEffect } from 'react';
import { AgentConfigUpload } from '@/components/security/AgentConfigUpload';
import { AgentTerminal, AgentTerminalRef } from '@/components/security/AgentTerminal';
import { Terminal, ShieldCheck, ArrowLeft, Play, AlertTriangle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_CONFIG } from '@/config/api';

const TerminalAgentPage = () => {
  const [token, setToken] = useState<string | null>(null);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [isQueuingAction, setIsQueuingAction] = useState(false);
  const terminalRef = useRef<AgentTerminalRef>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if we arrived with a remediation command via URL params
  useEffect(() => {
    const cmd = searchParams.get('command');
    const t = searchParams.get('token');
    if (cmd) setPendingCommand(decodeURIComponent(cmd));
    if (t) {
      setToken(t);
      localStorage.setItem('aegios_terminal_token', t);
    }
  }, [searchParams]);

  const handleConfigSuccess = async (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('aegios_terminal_token', newToken);

    // If there's a pending remediation command, queue it via take-action
    if (pendingCommand) {
      await queueRemediationCommand(newToken, pendingCommand);
    }
  };

  const queueRemediationCommand = async (sessionToken: string, command: string) => {
    setIsQueuingAction(true);
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.SESSION.TAKE_ACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: sessionToken,
          command: command,
          correct_config: '',
        }),
      });

      if (!response.ok) {
        console.error('Failed to queue remediation command');
      }
    } catch (err) {
      console.error('Error queuing action:', err);
    } finally {
      setIsQueuingAction(false);
    }
  };

  const handleDisconnect = () => {
    // Optionally reset so user can reconnect
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Terminal className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">Terminal Agent</h1>
          </div>
          <p className="text-muted-foreground ml-[52px]">
            Connect to your Kubernetes cluster and remediate vulnerabilities directly from Aegios.
          </p>
        </div>
        <button
          onClick={() => navigate('/security-service/k8s-action')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Actions
        </button>
      </div>

      {/* Pending Remediation Banner */}
      {pendingCommand && !token && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-yellow-400">Remediation Command Queued</p>
            <p className="text-xs text-muted-foreground">
              Connect your cluster below — the following command will auto-execute once connected:
            </p>
            <code className="block mt-2 text-xs font-mono text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 break-all">
              {pendingCommand}
            </code>
          </div>
        </div>
      )}

      {/* Stepper Indicator */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${!token ? 'bg-primary/10 border border-primary/40 text-primary' : 'bg-green-500/10 border border-green-500/40 text-green-400'}`}>
          <ShieldCheck className="h-4 w-4" />
          <span className="text-sm font-medium">Step 1: Connect Cluster</span>
          {token && <span className="text-green-400 text-xs">✓</span>}
        </div>
        <div className="h-px w-8 bg-border" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${token ? 'bg-primary/10 border border-primary/40 text-primary' : 'bg-secondary/30 border border-border text-muted-foreground'}`}>
          <Terminal className="h-4 w-4" />
          <span className="text-sm font-medium">Step 2: Use Terminal</span>
        </div>
      </div>

      {/* Config Upload or Terminal */}
      {!token ? (
        <div className="p-6 rounded-xl bg-card border border-border neon-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Connect Your Cluster</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your Kubernetes context name, generate the connection command, run it in your terminal,
            then upload the generated config file.
          </p>
          <AgentConfigUpload onSuccess={handleConfigSuccess} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-green-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {isQueuingAction
                ? 'Queuing remediation command...'
                : pendingCommand
                  ? 'Cluster connected — Remediation command will auto-execute.'
                  : 'Cluster connected — You can now run kubectl commands below.'}
            </p>
            <button
              onClick={() => {
                setToken(null);
                localStorage.removeItem('aegios_terminal_token');
              }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors border border-border hover:border-destructive/50 px-3 py-1.5 rounded-lg"
            >
              Disconnect
            </button>
          </div>
          <AgentTerminal ref={terminalRef} token={token} onDisconnect={handleDisconnect} />
          
          {/* Manual command send */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const cmd = prompt('Enter kubectl command to execute:');
                if (cmd && terminalRef.current) {
                  terminalRef.current.sendCommand(cmd);
                }
              }}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50 px-3 py-1.5 rounded-lg"
            >
              <Play className="h-3 w-3" />
              Send Command
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TerminalAgentPage;
