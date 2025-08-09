// Shared configuration management
export interface ModuleConfig {
  name: string;
  version: string;
  database_name: string;
  features: string[];
  dependencies: string[];
}

export const ModuleConfigs: Record<string, ModuleConfig> = {
  journal: {
    name: 'journal',
    version: '1.0.0',
    database_name: 'journal',
    features: ['entries', 'analytics', 'export'],
    dependencies: ['ai']
  },
  meditation: {
    name: 'meditation',
    version: '1.0.0',
    database_name: 'meditation',
    features: ['sessions', 'analytics', 'soundscapes'],
    dependencies: ['ai']
  },
  community: {
    name: 'community',
    version: '1.0.0',
    database_name: 'community',
    features: ['learnings', 'messages', 'circles'],
    dependencies: ['ai']
  },
  ai: {
    name: 'ai',
    version: '1.0.0',
    database_name: 'ai_assistant',
    features: ['chat', 'preferences', 'conversations'],
    dependencies: []
  },
  codex: {
    name: 'codex',
    version: '1.0.0',
    database_name: 'codex',
    features: ['entries', 'analytics', 'sharing', 'resonance', 'ai_insights'],
    dependencies: ['ai']
  }
};

export function getModuleConfig(moduleName: string): ModuleConfig {
  const config = ModuleConfigs[moduleName];
  if (!config) {
    throw new Error(`Module configuration not found: ${moduleName}`);
  }
  return config;
}
