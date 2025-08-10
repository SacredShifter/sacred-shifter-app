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
    database_name: 'sacred_journal',
    features: ['entries', 'analytics', 'export'],
    dependencies: ['ai']
  },
  meditation: {
    name: 'meditation',
    version: '1.0.0',
    database_name: 'sacred_meditation',
    features: ['sessions', 'analytics', 'soundscapes'],
    dependencies: ['ai']
  },
  community: {
    name: 'community',
    version: '1.0.0',
    database_name: 'sacred_community',
    features: ['learnings', 'messages', 'circles'],
    dependencies: ['ai']
  },
  ai: {
    name: 'ai',
    version: '1.0.0',
    database_name: 'sacred_ai',
    features: ['chat', 'preferences', 'conversations'],
    dependencies: []
  },
  codex: {
    name: 'codex',
    version: '1.0.0',
    database_name: 'sacred_codex',
    features: ['entries', 'analytics', 'sharing', 'resonance', 'ai_insights'],
    dependencies: ['ai']
  },
  social: {
    name: 'social',
    version: '1.0.0',
    database_name: 'sacred_social',
    features: ['posts', 'comments', 'circles', 'profiles'],
    dependencies: ['ai']
  },
  messenger: {
    name: 'messenger',
    version: '1.0.0',
    database_name: 'sacred_social', // Uses the social DB
    features: ['threads', 'messages', 'realtime'],
    dependencies: ['social']
  }
};

export function getModuleConfig(moduleName: string): ModuleConfig {
  const config = ModuleConfigs[moduleName];
  if (!config) {
    throw new Error(`Module configuration not found: ${moduleName}`);
  }
  return config;
}
