import debug from 'debug';
import { ErrorHandler, EnhancedError, ValidationResult } from './error-handler.js';

const log = debug('coolify:parameter-validator');

export interface ParameterDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultProvider?: () => Promise<any> | any;
  validator?: (value: any) => boolean | string;
  description: string;
  examples?: any[];
  enumValues?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ParameterDefinition[];
  examples?: Record<string, any>[];
}

export class ParameterValidator {
  private static toolDefinitions: Map<string, ToolDefinition> = new Map();

  /**
   * Register tool parameter definitions
   */
  static registerTool(definition: ToolDefinition): void {
    log(`Registering tool: ${definition.name}`);
    this.toolDefinitions.set(definition.name, definition);
  }

  /**
   * Validate parameters for a specific tool
   */
  static validateParameters(
    toolName: string,
    parameters: Record<string, any>
  ): ValidationResult {
    const definition = this.toolDefinitions.get(toolName);
    if (!definition) {
      return {
        valid: false,
        errors: [`Unknown tool: ${toolName}`],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required parameters
    for (const paramDef of definition.parameters) {
      if (paramDef.required && !(paramDef.name in parameters)) {
        errors.push(`Missing required parameter: ${paramDef.name}`);
        continue;
      }

      const value = parameters[paramDef.name];
      if (value !== undefined) {
        // Type validation
        const typeError = this.validateType(paramDef.name, value, paramDef.type);
        if (typeError) {
          errors.push(typeError);
          continue;
        }

        // Enum validation
        if (paramDef.enumValues && !paramDef.enumValues.includes(value)) {
          errors.push(
            `Invalid value for ${paramDef.name}. Expected one of: ${paramDef.enumValues.join(', ')}`
          );
          continue;
        }

        // Custom validation
        if (paramDef.validator) {
          const validationResult = paramDef.validator(value);
          if (validationResult !== true) {
            const message = typeof validationResult === 'string' 
              ? validationResult 
              : `Invalid value for ${paramDef.name}`;
            errors.push(message);
          }
        }
      }
    }

    // Check for unknown parameters
    for (const paramName in parameters) {
      if (!definition.parameters.some(p => p.name === paramName)) {
        warnings.push(`Unknown parameter: ${paramName}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Enrich parameters with default values
   */
  static async enrichWithDefaults(
    toolName: string,
    parameters: Record<string, any>
  ): Promise<Record<string, any>> {
    const definition = this.toolDefinitions.get(toolName);
    if (!definition) {
      return parameters;
    }

    const enriched = { ...parameters };

    for (const paramDef of definition.parameters) {
      if (!(paramDef.name in enriched) && paramDef.defaultProvider) {
        try {
          const defaultValue = typeof paramDef.defaultProvider === 'function'
            ? await paramDef.defaultProvider()
            : paramDef.defaultProvider;
          
          if (defaultValue !== undefined) {
            enriched[paramDef.name] = defaultValue;
            log(`Applied default value for ${paramDef.name}: ${defaultValue}`);
          }
        } catch (error) {
          log(`Failed to get default value for ${paramDef.name}: ${error}`);
        }
      }
    }

    return enriched;
  }

  /**
   * Get parameter documentation for a tool
   */
  static getToolDocumentation(toolName: string): string {
    const definition = this.toolDefinitions.get(toolName);
    if (!definition) {
      return `Unknown tool: ${toolName}`;
    }

    let doc = `# ${definition.name}\n\n${definition.description}\n\n## Parameters\n\n`;

    for (const param of definition.parameters) {
      doc += `### ${param.name} (${param.type})${param.required ? ' *required*' : ''}\n`;
      doc += `${param.description}\n\n`;

      if (param.enumValues) {
        doc += `**Valid values:** ${param.enumValues.join(', ')}\n\n`;
      }

      if (param.examples && param.examples.length > 0) {
        doc += `**Examples:** ${param.examples.map(e => JSON.stringify(e)).join(', ')}\n\n`;
      }
    }

    if (definition.examples && definition.examples.length > 0) {
      doc += `## Usage Examples\n\n`;
      definition.examples.forEach((example, index) => {
        doc += `### Example ${index + 1}\n\n`;
        doc += '```json\n';
        doc += JSON.stringify(example, null, 2);
        doc += '\n```\n\n';
      });
    }

    return doc;
  }

  /**
   * Get parameter suggestions for a tool
   */
  static getParameterSuggestions(
    toolName: string,
    currentParameters: Record<string, any> = {}
  ): string[] {
    const definition = this.toolDefinitions.get(toolName);
    if (!definition) {
      return [];
    }

    const suggestions: string[] = [];

    // Suggest missing required parameters
    for (const param of definition.parameters) {
      if (param.required && !(param.name in currentParameters)) {
        suggestions.push(`Add required parameter: ${param.name} (${param.description})`);
      }
    }

    // Suggest optional parameters that might be useful
    for (const param of definition.parameters) {
      if (!param.required && !(param.name in currentParameters)) {
        if (param.examples && param.examples.length > 0) {
          suggestions.push(
            `Consider adding ${param.name}: ${JSON.stringify(param.examples[0])}`
          );
        }
      }
    }

    return suggestions;
  }

  /**
   * Validate parameter type
   */
  private static validateType(
    paramName: string,
    value: any,
    expectedType: string
  ): string | null {
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (expectedType === 'object' && actualType === 'object' && value !== null) {
      return null; // Valid object
    }

    if (actualType !== expectedType) {
      return `Parameter ${paramName} expected ${expectedType}, got ${actualType}`;
    }

    return null;
  }

  /**
   * Create enhanced validation error with suggestions
   */
  static createValidationError(
    toolName: string,
    validationResult: ValidationResult,
    parameters: Record<string, any>
  ): EnhancedError {
    const suggestions = [
      ...this.getParameterSuggestions(toolName, parameters),
      `Use getToolDocumentation('${toolName}') for detailed parameter information`
    ];

    return ErrorHandler.createValidationError(
      `Parameter validation failed for ${toolName}: ${validationResult.errors.join(', ')}`,
      {
        tool: toolName,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        parameters,
        suggestions
      }
    );
  }

  /**
   * Initialize with default tool definitions
   */
  static initializeDefaultTools(): void {
    // Server management tools
    this.registerTool({
      name: 'list_servers',
      description: 'List all Coolify servers',
      parameters: [],
      examples: [{}]
    });

    this.registerTool({
      name: 'get_server',
      description: 'Get details about a specific Coolify server',
      parameters: [
        {
          name: 'uuid',
          type: 'string',
          required: true,
          description: 'UUID of the server to get details for',
          validator: (value) => typeof value === 'string' && value.length > 0
        }
      ],
      examples: [
        { uuid: 'a8gwwc0o0w4s00wgoogsko88' }
      ]
    });

    // Project management tools
    this.registerTool({
      name: 'create_project',
      description: 'Create a new Coolify project',
      parameters: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Name of the project',
          validator: (value) => typeof value === 'string' && value.length > 0,
          examples: ['my-project', 'web-app']
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Description of the project',
          examples: ['My awesome project', 'Web application deployment']
        }
      ],
      examples: [
        { name: 'my-project', description: 'My awesome project' },
        { name: 'web-app' }
      ]
    });

    // Service creation tool with enhanced validation
    this.registerTool({
      name: 'create_service',
      description: 'Create a new Coolify service',
      parameters: [
        {
          name: 'type',
          type: 'string',
          required: true,
          description: 'Type of service to create',
          enumValues: [
            'activepieces', 'appsmith', 'appwrite', 'authentik', 'babybuddy',
            'budge', 'changedetection', 'chatwoot', 'classicpress-with-mariadb',
            'classicpress-with-mysql', 'classicpress-without-database',
            'cloudflared', 'code-server', 'dashboard', 'directus',
            'directus-with-postgresql', 'docker-registry', 'docuseal',
            'docuseal-with-postgres', 'dokuwiki', 'duplicati', 'emby',
            'embystat', 'fider', 'filebrowser', 'firefly', 'formbricks',
            'ghost', 'gitea', 'gitea-with-mariadb', 'gitea-with-mysql',
            'gitea-with-postgresql', 'glance', 'glances', 'glitchtip',
            'grafana', 'grafana-with-postgresql', 'grocy', 'heimdall',
            'homepage', 'jellyfin', 'kuzzle', 'listmonk', 'logto',
            'mediawiki', 'meilisearch', 'metabase', 'metube', 'minio',
            'moodle', 'n8n', 'n8n-with-postgresql', 'next-image-transformation',
            'nextcloud', 'nocodb', 'odoo', 'openblocks', 'pairdrop',
            'penpot', 'phpmyadmin', 'pocketbase', 'posthog', 'reactive-resume',
            'rocketchat', 'shlink', 'slash', 'snapdrop', 'statusnook',
            'stirling-pdf', 'supabase', 'syncthing', 'tolgee', 'trigger',
            'trigger-with-external-database', 'twenty', 'umami',
            'unleash-with-postgresql', 'unleash-without-database',
            'uptime-kuma', 'vaultwarden', 'vikunja', 'weblate', 'whoogle',
            'wordpress-with-mariadb', 'wordpress-with-mysql',
            'wordpress-without-database'
          ]
        },
        {
          name: 'project_uuid',
          type: 'string',
          required: true,
          description: 'UUID of the project to create the service in'
        },
        {
          name: 'server_uuid',
          type: 'string',
          required: true,
          description: 'UUID of the server to deploy the service on'
        },
        {
          name: 'name',
          type: 'string',
          required: false,
          description: 'Custom name for the service'
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Description of the service'
        },
        {
          name: 'environment_name',
          type: 'string',
          required: false,
          description: 'Name of the environment (defaults to "production")',
          defaultProvider: () => 'production'
        },
        {
          name: 'instant_deploy',
          type: 'boolean',
          required: false,
          description: 'Whether to deploy the service immediately',
          defaultProvider: () => false
        }
      ],
      examples: [
        {
          type: 'minio',
          project_uuid: 'project-uuid-here',
          server_uuid: 'server-uuid-here',
          name: 'my-storage',
          description: 'Object storage service'
        }
      ]
    });

    log('Initialized default tool definitions');
  }
}