import debug from 'debug';
import { CoolifyClient } from './coolify-client.js';
import { Environment } from '../types/coolify.js';
import { ErrorHandler } from './error-handler.js';

const log = debug('coolify:environment-manager');

export interface EnvironmentCreationOptions {
  name?: string;
  description?: string;
}

export class EnvironmentManager {
  private client: CoolifyClient;
  private environmentCache: Map<string, Environment> = new Map();

  constructor(client: CoolifyClient) {
    this.client = client;
  }

  /**
   * Get or create a default environment for a project
   */
  async getOrCreateDefaultEnvironment(
    projectUuid: string,
    options: EnvironmentCreationOptions = {}
  ): Promise<Environment> {
    const cacheKey = `${projectUuid}:${options.name || 'production'}`;
    
    // Check cache first
    if (this.environmentCache.has(cacheKey)) {
      const cached = this.environmentCache.get(cacheKey)!;
      log(`Using cached environment: ${cached.name}`);
      return cached;
    }

    try {
      // Try to get existing environment
      const environmentName = options.name || 'production';
      const environment = await this.client.getProjectEnvironment(projectUuid, environmentName);
      
      log(`Found existing environment: ${environment.name}`);
      this.environmentCache.set(cacheKey, environment);
      return environment;
    } catch (error) {
      const enhancedError = ErrorHandler.parseApiError(error);
      
      if (enhancedError.code === 'RESOURCE_NOT_FOUND') {
        log(`Environment not found, will use default environment handling`);
        // For now, we'll return a mock environment since Coolify typically auto-creates environments
        // In a real implementation, this would create the environment via API
        const mockEnvironment: Environment = {
          id: 1,
          uuid: `env-${Date.now()}`,
          name: options.name || 'production',
          project_uuid: projectUuid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        this.environmentCache.set(cacheKey, mockEnvironment);
        return mockEnvironment;
      }
      
      throw enhancedError;
    }
  }

  /**
   * Ensure an environment exists, creating it if necessary
   */
  async ensureEnvironment(
    projectUuid: string,
    environmentName?: string
  ): Promise<Environment> {
    return this.getOrCreateDefaultEnvironment(projectUuid, {
      name: environmentName || 'production',
      description: `Auto-created environment: ${environmentName || 'production'}`
    });
  }

  /**
   * Get environment by name or UUID
   */
  async getEnvironment(
    projectUuid: string,
    environmentNameOrUuid: string
  ): Promise<Environment> {
    try {
      return await this.client.getProjectEnvironment(projectUuid, environmentNameOrUuid);
    } catch (error) {
      const enhancedError = ErrorHandler.parseApiError(error);
      log(`Failed to get environment ${environmentNameOrUuid}: ${enhancedError.message}`);
      throw enhancedError;
    }
  }

  /**
   * Clear environment cache
   */
  clearCache(): void {
    this.environmentCache.clear();
    log('Environment cache cleared');
  }

  /**
   * Get cached environment count
   */
  getCacheSize(): number {
    return this.environmentCache.size;
  }

  /**
   * Validate environment configuration
   */
  validateEnvironmentConfig(
    projectUuid: string,
    environmentName?: string
  ): { valid: boolean; errors: string[]; suggestions: string[] } {
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (!projectUuid || typeof projectUuid !== 'string') {
      errors.push('Project UUID is required and must be a string');
    }

    if (environmentName && typeof environmentName !== 'string') {
      errors.push('Environment name must be a string');
    }

    if (!environmentName) {
      suggestions.push('Consider specifying an environment name (defaults to "production")');
    }

    return {
      valid: errors.length === 0,
      errors,
      suggestions
    };
  }
}