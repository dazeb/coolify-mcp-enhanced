#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CoolifyMcpServer } from './lib/mcp-server.js';
import { EnhancedCoolifyMcpServer } from './lib/enhanced-mcp-server.js';
import { CoolifyConfig } from './types/coolify.js';

declare const process: NodeJS.Process;

async function main(): Promise<void> {
  const config: CoolifyConfig = {
    baseUrl: process.env.COOLIFY_BASE_URL || 'http://localhost:3000',
    accessToken: process.env.COOLIFY_ACCESS_TOKEN || '',
  };

  if (!config.accessToken) {
    throw new Error('COOLIFY_ACCESS_TOKEN environment variable is required');
  }

  // Use enhanced server if ENHANCED flag is set, otherwise use original
  const useEnhanced = process.env.COOLIFY_MCP_ENHANCED === 'true';
  const server = useEnhanced 
    ? new EnhancedCoolifyMcpServer(config)
    : new CoolifyMcpServer(config);

  const transport = new StdioServerTransport();

  console.error(`Starting ${useEnhanced ? 'Enhanced' : 'Standard'} Coolify MCP Server...`);
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
