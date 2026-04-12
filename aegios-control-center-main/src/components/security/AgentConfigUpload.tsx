import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, RefreshCw, Loader2, Zap, Terminal } from 'lucide-react';
import { API_CONFIG } from '@/config/api';

interface AgentConfigUploadProps {
  onSuccess: (token: string) => void;
}

export const AgentConfigUpload: React.FC<AgentConfigUploadProps> = ({ onSuccess }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [contextInput, setContextInput] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [clusterMode, setClusterMode] = useState<'checking' | 'direct' | 'agent' | null>(null);

  const [generatedData, setGeneratedData] = useState<{token: string, command: string} | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for config upload status, then check cluster mode
  useEffect(() => {
    if (!generatedData || !isPolling) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_CONFIG.ENDPOINTS.SESSION.CONFIG_STATUS}?token=${generatedData.token}`
        );
        const data = await response.json();

        if (data.success && data.has_config) {
          // Config uploaded — now check cluster mode
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsPolling(false);
          setClusterMode('checking');

          const modeRes = await fetch(
            `${API_CONFIG.ENDPOINTS.SESSION.CLUSTER_MODE}?token=${generatedData.token}`
          );
          const modeData = await modeRes.json();

          if (modeData.mode === 'direct') {
            // Cluster reachable from backend — skip agent, go to terminal!
            setClusterMode('direct');
            setTimeout(() => onSuccess(generatedData.token), 500);
          } else {
            // Agent mode — wait for WebSocket agent to connect
            setClusterMode('agent');
            onSuccess(generatedData.token);
          }
        }
      } catch {
        // Silently retry
      }
    }, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [generatedData, isPolling, onSuccess]);

  const handleGenerate = async () => {
    if (!contextInput) {
      setError('Please provide a context name.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setClusterMode(null);
    try {
      const response = await fetch(API_CONFIG.ENDPOINTS.SESSION.GENERATE_COMMAND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: "1", context_name: contextInput }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate command');
      }

      setGeneratedData({
        token: data.token,
        command: data.command,
      });

      setIsPolling(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedData) return;
    navigator.clipboard.writeText(generatedData.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col justify-center gap-4">
      {/* Step 1: Enter context and generate command */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 flex flex-col gap-2">
          <div className="h-[80px] bg-[#29A35C]/10 border border-[#29A35C]/50 rounded-xl flex items-center px-4 transition-colors focus-within:border-[#29A35C] focus-within:bg-[#29A35C]/20">
            <input
              type="text"
              value={contextInput}
              onChange={(e) => {
                setContextInput(e.target.value);
                setGeneratedData(null);
                setIsPolling(false);
                setClusterMode(null);
                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              }}
              placeholder="enter cluster context"
              className="w-full bg-transparent text-center text-green-muted placeholder:text-green-muted/50 font-medium focus:outline-none"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !contextInput}
            className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-black font-semibold rounded-lg flex justify-center items-center gap-2 transition-colors"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Generate Link'}
          </button>
        </div>

        <div className="col-span-2">
          <div className="h-[80px] bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center justify-center relative hover:bg-red-500/20 transition-colors group">
            <code className="text-red-400 font-mono text-sm text-center break-all px-6">
              {generatedData ? generatedData.command : 'Fill in the context and generate link first'}
            </code>
            {generatedData && (
              <button
                onClick={handleCopy}
                className="absolute right-4 text-red-500/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Copy command"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Status indicator */}
      {generatedData && isPolling && (
        <div className="h-[80px] bg-[#29A35C]/10 border-2 border-dashed border-[#29A35C]/50 rounded-xl flex items-center justify-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 text-green-400 animate-spin" />
          <span className="font-semibold text-green-muted text-sm">
            Waiting for agent to connect... Copy and run the command above in your terminal.
          </span>
        </div>
      )}

      {clusterMode === 'checking' && (
        <div className="h-[80px] bg-blue-500/10 border-2 border-dashed border-blue-500/50 rounded-xl flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
          <span className="font-semibold text-blue-400 text-sm">
            Checking cluster reachability...
          </span>
        </div>
      )}

      {clusterMode === 'direct' && (
        <div className="h-[80px] bg-green-500/10 border-2 border-green-500/50 rounded-xl flex items-center justify-center gap-3">
          <Zap className="w-5 h-5 text-green-400" />
          <span className="font-semibold text-green-400 text-sm">
            ⚡ Direct mode — cluster is reachable! No agent needed. Opening terminal...
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-500 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
};
