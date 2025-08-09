import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useModuleStatus } from '../hooks/useModuleHealth';

interface ModuleHealthIndicatorProps {
  moduleName: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ModuleHealthIndicator({ 
  moduleName, 
  showLabel = false, 
  size = 'sm' 
}: ModuleHealthIndicatorProps) {
  const { status, isHealthy, isDegraded, isUnhealthy, version, uptime } = useModuleStatus(moduleName);

  const getIcon = () => {
    const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
    
    if (isHealthy) {
      return <CheckCircle className={`${iconSize} text-green-500`} />;
    } else if (isDegraded) {
      return <AlertTriangle className={`${iconSize} text-yellow-500`} />;
    } else if (isUnhealthy) {
      return <AlertCircle className={`${iconSize} text-red-500`} />;
    } else {
      return <AlertCircle className={`${iconSize} text-gray-400`} />;
    }
  };

  const getBadgeVariant = () => {
    if (isHealthy) return 'default';
    if (isDegraded) return 'secondary';
    return 'destructive';
  };

  const getStatusText = () => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const content = (
    <div className="flex items-center space-x-2">
      {getIcon()}
      {showLabel && (
        <Badge variant={getBadgeVariant()} className="text-xs">
          {moduleName} - {getStatusText()}
        </Badge>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <div className="font-medium">{moduleName} Module</div>
            <div>Status: {getStatusText()}</div>
            {version && <div>Version: {version}</div>}
            <div>Uptime: {formatUptime(uptime)}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
