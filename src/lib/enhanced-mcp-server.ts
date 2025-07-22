import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CoolifyClient } from './coolify-client.js';
import { ErrorHandler, EnhancedError } from './error-handler.js';
import { ParameterValidator } from './parameter-validator.js';
import { EnvironmentManager } from './environment-manager.js';
import debug from 'debug';
import { z } from 'zod';
import type {
  ServerInfo,
  ServerResources,
  ServerDomain,
  ValidationResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  Environment,
  Deployment,
  Database,
  DatabaseUpdateRequest,
  Service,
  CreateServiceRequest,
  DeleteServiceOptions,
} from '../types/coolify.js';

const log = debug('coolify:enhanced-mcp');

// Define valid service types
const serviceTypes = [
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
] as const;

export class EnhancedCoolifyMcpServer extends McpServer {
  private client: CoolifyClient;
  private environmentManager: EnvironmentManager;

  constructor(config: { baseUrl: string; accessToken: string }) {
    super({
      name: 'coolify-enhanced',
      version: '0.2.0'
    });
    
    log('Initializing enhanced server with config: %o', config);
    this.client = new CoolifyClient(config);
    this.environmentManager = new EnvironmentManager(this.client);
    
    // Initialize parameter validator with tool definitions
    ParameterValidator.initializeDefaultTools();
  }

  async initialize(): Promise<void> {
    // Register capabilities first
    await this.server.registerCapabilities({
      tools: {}
    });

    // Enhanced server management tools
    this.tool('list_servers', 'List all Coolify servers with enhanced error handling', {}, 
      async () => {
        return this.executeWithEnhancedHandling('list_servers', {}, async () => {
          const servers = await this.client.listServers();
          return {
            content: [{ 
              type: 'text', 
              text: JSON.stringify({
                success: true,
                data: servers,
                count: servers.length,
                message: `Successfully retrieved ${servers.length} servers`
              }, null, 2) 
            }]
          };
        });
      }
    );

    this.tool('get_server', 'Get details about a specific Coolify server with validation', {
      uuid: z.string().describe('UUID of the server to get details for')
    }, async (args) => {
      return this.executeWithEnhancedHandling('get_server', args, async (validatedArgs) => {
        const server = await this.client.getServer(validatedArgs.uuid);
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: server,
              message: `Successfully retrieved server: ${server.name}`
            }, null, 2) 
          }]
        };
      });
    });

    // Enhanced project management
    this.tool('create_project', 'Create a new Coolify project with validation and defaults', {
      name: z.string().describe('Name of the project'),
      description: z.string().optional().describe('Description of the project')
    }, async (args) => {
      return this.executeWithEnhancedHandling('create_project', args, async (validatedArgs) => {
        const result = await this.client.createProject({
          name: validatedArgs.name,
          description: validatedArgs.description || `Project: ${validatedArgs.name}`
        });
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: result,
              message: `Successfully created project: ${validatedArgs.name}`,
              next_steps: [
                'You can now create services in this project',
                'Use create_service to add services to this project',
                'Use get_project to view project details'
              ]
            }, null, 2) 
          }]
        };
      });
    });

    // Register parameter validator for enhanced service creation
    ParameterValidator.registerTool({
      name: 'create_service_enhanced',
      description: 'Create a new Coolify service with auto-configuration',
      parameters: [
        {
          name: 'type',
          type: 'string',
          required: true,
          description: 'Type of service to create',
          enumValues: [...serviceTypes]
        },
        {
          name: 'project_uuid',
          type: 'string',
          required: true,
          description: 'UUID of the project'
        },
        {
          name: 'server_uuid',
          type: 'string',
          required: true,
          description: 'UUID of the server'
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
          description: 'Environment name (auto-created if not exists)',
          defaultProvider: () => 'production'
        },
        {
          name: 'instant_deploy',
          type: 'boolean',
          required: false,
          description: 'Deploy immediately after creation',
          defaultProvider: () => false
        }
      ]
    });

    // Enhanced service creation with auto-configuration
    this.tool('create_service_enhanced', 'Create a new Coolify service with auto-configuration', {
      type: z.enum(serviceTypes).describe('Type of service to create'),
      project_uuid: z.string().describe('UUID of the project'),
      server_uuid: z.string().describe('UUID of the server'),
      name: z.string().optional().describe('Custom name for the service'),
      description: z.string().optional().describe('Description of the service'),
      environment_name: z.string().optional().describe('Environment name (auto-created if not exists)'),
      instant_deploy: z.boolean().optional().describe('Deploy immediately after creation')
    }, async (args) => {
      return this.executeWithEnhancedHandling('create_service_enhanced', args, async (validatedArgs) => {
        // Auto-configure environment if not provided
        let environmentName = validatedArgs.environment_name;
        if (!environmentName) {
          log('No environment specified, using default environment handling');
          try {
            const environment = await this.environmentManager.getOrCreateDefaultEnvironment(
              validatedArgs.project_uuid
            );
            environmentName = environment.name;
            log(`Using environment: ${environmentName}`);
          } catch (error) {
            log('Failed to get/create environment, proceeding without environment_name');
          }
        }

        // Prepare service creation request
        const serviceRequest: CreateServiceRequest = {
          type: validatedArgs.type,
          project_uuid: validatedArgs.project_uuid,
          server_uuid: validatedArgs.server_uuid,
          name: validatedArgs.name || `${validatedArgs.type}-service`,
          description: validatedArgs.description || `Auto-created ${validatedArgs.type} service`,
          environment_name: environmentName,
          instant_deploy: validatedArgs.instant_deploy || false
        };

        const result = await this.client.createService(serviceRequest);
        
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: result,
              message: `Successfully created ${validatedArgs.type} service`,
              configuration: {
                service_type: validatedArgs.type,
                environment: environmentName,
                instant_deploy: serviceRequest.instant_deploy
              },
              next_steps: [
                'Service is being created in the background',
                'Use get_service to check the service status',
                'Check the Coolify dashboard for deployment progress'
              ]
            }, null, 2) 
          }]
        };
      });
    });

    // Enhanced application creation
    this.tool('create_application_enhanced', 'Create a new Coolify application with auto-detection', {
      name: z.string().describe('Name of the application'),
      description: z.string().optional().describe('Description of the application'),
      project_uuid: z.string().describe('UUID of the project'),
      server_uuid: z.string().describe('UUID of the server'),
      git_repository: z.string().optional().describe('Git repository URL'),
      git_branch: z.string().optional().describe('Git branch (defaults to main)'),
      build_pack: z.enum(['nixpacks', 'dockerfile', 'docker-compose', 'static']).optional().describe('Build pack type'),
      environment_name: z.string().optional().describe('Environment name (auto-created if not exists)')
    }, async (args) => {
      return this.executeWithEnhancedHandling('create_application_enhanced', args, async (validatedArgs) => {
        // Auto-configure environment
        let environmentName = validatedArgs.environment_name;
        if (!environmentName) {
          try {
            const environment = await this.environmentManager.getOrCreateDefaultEnvironment(
              validatedArgs.project_uuid
            );
            environmentName = environment.name;
          } catch (error) {
            log('Failed to get/create environment for application');
          }
        }

        const applicationRequest = {
          name: validatedArgs.name,
          description: validatedArgs.description || `Application: ${validatedArgs.name}`,
          project_uuid: validatedArgs.project_uuid,
          server_uuid: validatedArgs.server_uuid,
          git_repository: validatedArgs.git_repository,
          git_branch: validatedArgs.git_branch || 'main',
          build_pack: validatedArgs.build_pack || 'nixpacks',
          environment_name: environmentName
        };

        const result = await this.client.createApplication(applicationRequest);
        
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: result,
              message: `Successfully created application: ${validatedArgs.name}`,
              configuration: {
                build_pack: applicationRequest.build_pack,
                environment: environmentName,
                git_branch: applicationRequest.git_branch
              },
              next_steps: [
                'Application is being created',
                'Use get_application to check status',
                'Configure environment variables if needed',
                'Deploy using deploy_application'
              ]
            }, null, 2) 
          }]
        };
      });
    });

    // Add all other existing tools with enhanced error handling
    await this.registerRemainingTools();
  }

  /**
   * Execute tool with enhanced error handling and parameter validation
   */
  private async executeWithEnhancedHandling<T>(
    toolName: string,
    parameters: any,
    operation: (validatedParams: any) => Promise<T>
  ): Promise<T> {
    try {
      // Validate parameters
      const validation = ParameterValidator.validateParameters(toolName, parameters);
      if (!validation.valid) {
        const error = ParameterValidator.createValidationError(toolName, validation, parameters);
        throw error;
      }

      // Enrich with defaults
      const enrichedParams = await ParameterValidator.enrichWithDefaults(toolName, parameters);
      
      // Execute operation
      const result = await operation(enrichedParams);
      
      log(`Tool ${toolName} executed successfully`);
      return result;
      
    } catch (error) {
      const enhancedError = ErrorHandler.parseApiError(error);
      log(`Tool ${toolName} failed: ${enhancedError.code} - ${enhancedError.message}`);
      
      // Return structured error response
      return {
        content: [{ 
          type: 'text', 
          text: JSON.stringify({
            success: false,
            error: {
              code: enhancedError.code,
              message: enhancedError.message,
              suggestions: enhancedError.suggestions || [],
              details: enhancedError.details
            },
            tool: toolName,
            parameters,
            timestamp: new Date().toISOString()
          }, null, 2) 
        }]
      } as T;
    }
  }

  /**
   * Register remaining tools with enhanced error handling
   */
  private async registerRemainingTools(): Promise<void> {
    // Add all the existing tools from the original server but with enhanced error handling
    // This is a simplified version - in practice, each tool would be enhanced individually
    
    this.tool('list_projects', 'List all Coolify projects', {}, async () => {
      return this.executeWithEnhancedHandling('list_projects', {}, async () => {
        const projects = await this.client.listProjects();
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: projects,
              count: projects.length
            }, null, 2) 
          }]
        };
      });
    });

    this.tool('list_applications', 'List all Coolify applications', {}, async () => {
      return this.executeWithEnhancedHandling('list_applications', {}, async () => {
        const applications = await this.client.listApplications();
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: applications,
              count: applications.length
            }, null, 2) 
          }]
        };
      });
    });

    this.tool('list_services', 'List all Coolify services', {}, async () => {
      return this.executeWithEnhancedHandling('list_services', {}, async () => {
        const services = await this.client.listServices();
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: services,
              count: services.length
            }, null, 2) 
          }]
        };
      });
    });

    // Project management tools
    this.tool('get_project', 'Get details about a specific Coolify project', {
      uuid: z.string().describe('UUID of the project')
    }, async (args) => {
      return this.executeWithEnhancedHandling('get_project', args, async (validatedArgs) => {
        const project = await this.client.getProject(validatedArgs.uuid);
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: project,
              message: `Successfully retrieved project: ${project.name}`
            }, null, 2) 
          }]
        };
      });
    });

    this.tool('delete_project', 'Delete a Coolify project', {
      uuid: z.string().describe('UUID of the project to delete')
    }, async (args) => {
      return this.executeWithEnhancedHandling('delete_project', args, async (validatedArgs) => {
        const result = await this.client.deleteProject(validatedArgs.uuid);
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: result,
              message: `Successfully deleted project`
            }, null, 2) 
          }]
        };
      });
    });

    // Service management tools
    this.tool('get_service', 'Get details about a specific Coolify service', {
      uuid: z.string().describe('UUID of the service')
    }, async (args) => {
      return this.executeWithEnhancedHandling('get_service', args, async (validatedArgs) => {
        const service = await this.client.getService(validatedArgs.uuid);
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: service,
              message: `Successfully retrieved service: ${service.name}`
            }, null, 2) 
          }]
        };
      });
    });

    // Application management tools
    this.tool('get_application', 'Get details about a specific Coolify application', {
      uuid: z.string().describe('UUID of the application')
    }, async (args) => {
      return this.executeWithEnhancedHandling('get_application', args, async (validatedArgs) => {
        const application = await this.client.getApplication(validatedArgs.uuid);
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: application,
              message: `Successfully retrieved application: ${application.name}`
            }, null, 2) 
          }]
        };
      });
    });

    // Server resource management
    this.tool('get_server_resources', 'Get resources running on a specific Coolify server', {
      uuid: z.string().describe('UUID of the server')
    }, async (args) => {
      return this.executeWithEnhancedHandling('get_server_resources', args, async (validatedArgs) => {
        const resources = await this.client.getServerResources(validatedArgs.uuid);
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: resources,
              count: resources.length,
              message: `Successfully retrieved ${resources.length} server resources`
            }, null, 2) 
          }]
        };
      });
    });

    this.tool('get_server_domains', 'Get domains for a specific Coolify server', {
      uuid: z.string().describe('UUID of the server')
    }, async (args) => {
      return this.executeWithEnhancedHandling('get_server_domains', args, async (validatedArgs) => {
        const domains = await this.client.getServerDomains(validatedArgs.uuid);
        return {
          content: [{ 
            type: 'text', 
            text: JSON.stringify({
              success: true,
              data: domains,
              count: domains.length,
              message: `Successfully retrieved domain configurations`
            }, null, 2) 
          }]
        };
      });
    });

    // Add tool documentation endpoint
    this.tool('get_tool_documentation', 'Get documentation for a specific tool', {
      tool_name: z.string().describe('Name of the tool to get documentation for')
    }, async (args) => {
      const documentation = ParameterValidator.getToolDocumentation(args.tool_name);
      return {
        content: [{ type: 'text', text: documentation }]
      };
    });
  }

  async connect(transport: Transport): Promise<void> {
    log('Starting enhanced server...');
    log('Validating connection...');
    await this.client.validateConnection();
    await this.initialize();
    await super.connect(transport);
    log('Enhanced server started successfully');
  }
}