import { useQuery } from '@tanstack/react-query';
import { systemClient } from '../lib/moduleClient';

export function useModuleHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => systemClient.getHealth(),
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1, // Don't retry too aggressively for health checks
  });
}

export function useModuleStatus(moduleName: string) {
  const { data: healthData } = useModuleHealth();
  
  const moduleHealth = healthData?.modules.find(m => m.service === moduleName);
  
  return {
    status: moduleHealth?.status || 'unknown',
    isHealthy: moduleHealth?.status === 'healthy',
    isDegraded: moduleHealth?.status === 'degraded',
    isUnhealthy: moduleHealth?.status === 'unhealthy',
    version: moduleHealth?.version,
    uptime: moduleHealth?.uptime
  };
}
