import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CoolifyClient } from './coolify-client.js';
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

const log = debug('coolify:mcp');

// Define valid service types
const serviceTypes = [
  'activepieces',
  'appsmith',
  'appwrite',
  'authentik',
  'babybuddy',
  'budge',
  'changedetection',
  'chatwoot',
  'classicpress-with-mariadb',
  'classicpress-with-mysql',
  'classicpress-without-database',
  'cloudflared',
  'code-server',
  'dashboard',
  'directus',
  'directus-with-postgresql',
  'docker-registry',
  'docuseal',
  'docuseal-with-postgres',
  'dokuwiki',
  'duplicati',
  'emby',
  'embystat',
  'fider',
  'filebrowser',
  'firefly',
  'formbricks',
  'ghost',
  'gitea',
  'gitea-with-mariadb',
  'gitea-with-mysql',
  'gitea-with-postgresql',
  'glance',
  'glances',
  'glitchtip',
  'grafana',
  'grafana-with-postgresql',
  'grocy',
  'heimdall',
  'homepage',
  'jellyfin',
  'kuzzle',
  'listmonk',
  'logto',
  'mediawiki',
  'meilisearch',
  'metabase',
  'metube',
  'minio',
  'moodle',
  'n8n',
  'n8n-with-postgresql',
  'next-image-transformation',
  'nextcloud',
  'nocodb',
  'odoo',
  'openblocks',
  'pairdrop',
  'penpot',
  'phpmyadmin',
  'pocketbase',
  'posthog',
  'reactive-resume',
  'rocketchat',
  'shlink',
  'slash',
  'snapdrop',
  'statusnook',
  'stirling-pdf',
  'supabase',
  'syncthing',
  'tolgee',
  'trigger',
  'trigger-with-external-database',
  'twenty',
  'umami',
  'unleash-with-postgresql',
  'unleash-without-database',
  'uptime-kuma',
  'vaultwarden',
  'vikunja',
  'weblate',
  'whoogle',
  'wordpress-with-mariadb',
  'wordpress-with-mysql',
  'wordpress-without-database'
] as const;

export class CoolifyMcpServer extends McpServer {
  private client: CoolifyClient;

  constructor(config: { baseUrl: string; accessToken: string }) {
    super({
      name: 'coolify',
      version: '0.1.18'
    });
    
    log('Initializing server with config: %o', config);
    this.client = new CoolifyClient(config);
  }

  async initialize(): Promise<void> {
    // Register capabilities first
    await this.server.registerCapabilities({
      tools: {}
    });

    // Then register all tools
    this.tool('list_servers', 'List all Coolify servers', {}, async () => {
      const servers = await this.client.listServers();
      return {
        content: [{ type: 'text', text: JSON.stringify(servers, null, 2) }]
      };
    });

    this.tool('get_server', 'Get details about a specific Coolify server', {
      uuid: z.string().describe('UUID of the server to get details for')
    }, async (args) => {
      const server = await this.client.getServer(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(server, null, 2) }]
      };
    });

    this.tool('get_server_resources', 'Get the current resources running on a specific Coolify server', {
      uuid: z.string()
    }, async (args, _extra) => {
      const resources = await this.client.getServerResources(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(resources, null, 2) }]
      };
    });

    this.tool('get_server_domains', 'Get domains for a specific Coolify server', {
      uuid: z.string()
    }, async (args, _extra) => {
      const domains = await this.client.getServerDomains(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(domains, null, 2) }]
      };
    });

    this.tool('validate_server', 'Validate a specific Coolify server', {
      uuid: z.string()
    }, async (args, _extra) => {
      const validation = await this.client.validateServer(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(validation, null, 2) }]
      };
    });

    this.tool('list_projects', 'List all Coolify projects', {}, async (_args, _extra) => {
      const projects = await this.client.listProjects();
      return {
        content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }]
      };
    });

    this.tool('get_project', 'Get details about a specific Coolify project', {
      uuid: z.string()
    }, async (args, _extra) => {
      const project = await this.client.getProject(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(project, null, 2) }]
      };
    });

    this.tool('create_project', 'Create a new Coolify project', {
      name: z.string(),
      description: z.string().optional()
    }, async (args, _extra) => {
      const result = await this.client.createProject({
        name: args.name,
        description: args.description
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    this.tool('update_project', 'Update an existing Coolify project', {
      uuid: z.string(),
      name: z.string(),
      description: z.string().optional()
    }, async (args, _extra) => {
      const { uuid, ...updateData } = args;
      const result = await this.client.updateProject(uuid, updateData);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    this.tool('delete_project', 'Delete a Coolify project', {
      uuid: z.string()
    }, async (args, _extra) => {
      const result = await this.client.deleteProject(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    this.tool('get_project_environment', 'Get environment details for a Coolify project', {
      project_uuid: z.string(),
      environment_name_or_uuid: z.string()
    }, async (args, _extra) => {
      const environment = await this.client.getProjectEnvironment(args.project_uuid, args.environment_name_or_uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(environment, null, 2) }]
      };
    });

    this.tool('list_databases', 'List all Coolify databases', {}, async (_args, _extra) => {
      const databases = await this.client.listDatabases();
      return {
        content: [{ type: 'text', text: JSON.stringify(databases, null, 2) }]
      };
    });

    this.tool('get_database', 'Get details about a specific Coolify database', {
      uuid: z.string()
    }, async (args, _extra) => {
      const database = await this.client.getDatabase(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(database, null, 2) }]
      };
    });

    this.tool('update_database', 'Update a Coolify database', {
      uuid: z.string(),
      data: z.record(z.unknown())
    }, async (args, _extra) => {
      const result = await this.client.updateDatabase(args.uuid, args.data);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    const deleteOptionsSchema = {
      deleteConfigurations: z.boolean().optional(),
      deleteVolumes: z.boolean().optional(),
      dockerCleanup: z.boolean().optional(),
      deleteConnectedNetworks: z.boolean().optional()
    };

    this.tool('delete_database', 'Delete a Coolify database', {
      uuid: z.string(),
      options: z.object(deleteOptionsSchema).optional()
    }, async (args, _extra) => {
      const result = await this.client.deleteDatabase(args.uuid, args.options);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    this.tool('deploy_application', 'Deploy a Coolify application', {
      uuid: z.string()
    }, async (args, _extra) => {
      const result = await this.client.deployApplication(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    this.tool('list_services', 'List all Coolify services', {}, async (_args, _extra) => {
      const services = await this.client.listServices();
      return {
        content: [{ type: 'text', text: JSON.stringify(services, null, 2) }]
      };
    });

    this.tool('get_service', 'Get details about a specific Coolify service', {
      uuid: z.string()
    }, async (args, _extra) => {
      const service = await this.client.getService(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(service, null, 2) }]
      };
    });

    this.tool('create_service', 'Create a new Coolify service', {
      type: z.enum(serviceTypes),
      project_uuid: z.string(),
      server_uuid: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      environment_name: z.string().optional(),
      environment_uuid: z.string().optional(),
      destination_uuid: z.string().optional(),
      instant_deploy: z.boolean().optional()
    }, async (args, _extra) => {
      const result = await this.client.createService(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    this.tool('delete_service', 'Delete a Coolify service', {
      uuid: z.string(),
      options: z.object(deleteOptionsSchema).optional()
    }, async (args, _extra) => {
      const result = await this.client.deleteService(args.uuid, args.options);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    // Application Management Tools
    this.tool('list_applications', 'List all Coolify applications', {}, async (_args, _extra) => {
      const applications = await this.client.listApplications();
      return {
        content: [{ type: 'text', text: JSON.stringify(applications, null, 2) }]
      };
    });

    this.tool('get_application', 'Get details about a specific Coolify application', {
      uuid: z.string()
    }, async (args, _extra) => {
      const application = await this.client.getApplication(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(application, null, 2) }]
      };
    });

    this.tool('create_application', 'Create a new Coolify application', {
      name: z.string(),
      description: z.string().optional(),
      project_uuid: z.string(),
      server_uuid: z.string(),
      git_repository: z.string().optional(),
      git_branch: z.string().optional(),
      build_pack: z.enum(['nixpacks', 'dockerfile', 'docker-compose', 'static']).optional(),
      dockerfile_location: z.string().optional(),
      docker_compose_location: z.string().optional(),
      fqdn: z.string().optional(),
      environment_name: z.string().optional()
    }, async (args, _extra) => {
      const result = await this.client.createApplication(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    this.tool('delete_application', 'Delete a Coolify application', {
      uuid: z.string(),
      options: z.object(deleteOptionsSchema).optional()
    }, async (args, _extra) => {
      const result = await this.client.deleteApplication(args.uuid, args.options);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    // Environment Variable Management
    this.tool('get_application_environment_variables', 'Get environment variables for an application', {
      uuid: z.string()
    }, async (args, _extra) => {
      const variables = await this.client.getApplicationEnvironmentVariables(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(variables, null, 2) }]
      };
    });

    this.tool('update_application_environment_variables', 'Update environment variables for an application', {
      uuid: z.string(),
      variables: z.array(z.object({
        key: z.string(),
        value: z.string(),
        is_preview: z.boolean().optional(),
        is_build_time: z.boolean().optional(),
        is_literal: z.boolean().optional()
      }))
    }, async (args, _extra) => {
      const result = await this.client.updateApplicationEnvironmentVariables(args.uuid, args.variables);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    // Docker Compose Service Management
    this.tool('create_docker_compose_service', 'Create a new Docker Compose service', {
      name: z.string(),
      description: z.string().optional(),
      project_uuid: z.string(),
      server_uuid: z.string(),
      docker_compose_raw: z.string(),
      git_repository: z.string().optional(),
      git_branch: z.string().optional(),
      instant_deploy: z.boolean().optional()
    }, async (args, _extra) => {
      const result = await this.client.createDockerComposeService(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    // Deployment Management
    this.tool('get_deployments', 'Get deployments for an application', {
      application_uuid: z.string()
    }, async (args, _extra) => {
      const deployments = await this.client.getDeployments(args.application_uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(deployments, null, 2) }]
      };
    });

    this.tool('get_deployment', 'Get details about a specific deployment', {
      uuid: z.string()
    }, async (args, _extra) => {
      const deployment = await this.client.getDeployment(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(deployment, null, 2) }]
      };
    });

    this.tool('cancel_deployment', 'Cancel a running deployment', {
      uuid: z.string()
    }, async (args, _extra) => {
      const result = await this.client.cancelDeployment(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    // Application Resources and Logs
    this.tool('get_application_resources', 'Get resource usage for an application', {
      uuid: z.string()
    }, async (args, _extra) => {
      const resources = await this.client.getApplicationResources(args.uuid);
      return {
        content: [{ type: 'text', text: JSON.stringify(resources, null, 2) }]
      };
    });

    this.tool('get_application_logs', 'Get logs for an application', {
      uuid: z.string(),
      since: z.string().optional(),
      until: z.string().optional(),
      lines: z.number().optional()
    }, async (args, _extra) => {
      const { uuid, ...options } = args;
      const logs = await this.client.getApplicationLogs(uuid, options);
      return {
        content: [{ type: 'text', text: JSON.stringify(logs, null, 2) }]
      };
    });

    // MCPaaS Specific Tools
    this.tool('create_mcpaas_project', 'Create a new MCPaaS project with all required services', {
      name: z.string(),
      description: z.string().optional(),
      domain: z.string().optional(),
      server_uuid: z.string()
    }, async (args, _extra) => {
      const result = await this.client.createMCPaaSProject(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });

    this.tool('deploy_mcpaas_stack', 'Deploy the complete MCPaaS stack (PostgreSQL, Redis, MinIO)', {
      project_uuid: z.string(),
      server_uuid: z.string(),
      include_postgres: z.boolean().default(true),
      include_redis: z.boolean().default(true),
      include_minio: z.boolean().default(true),
      domain: z.string().optional(),
      environment_variables: z.record(z.string()).optional()
    }, async (args, _extra) => {
      const config = {
        includePostgres: args.include_postgres,
        includeRedis: args.include_redis,
        includeMinIO: args.include_minio,
        domain: args.domain,
        environment_variables: args.environment_variables
      };
      const result = await this.client.deployMCPaaSStack(args.project_uuid, args.server_uuid, config);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    });
  }

  async connect(transport: Transport): Promise<void> {
    log('Starting server...');
    log('Validating connection...');
    await this.client.validateConnection();
    await this.initialize();
    await super.connect(transport);
    log('Server started successfully');
  }

  async list_servers(): Promise<ServerInfo[]> {
    return this.client.listServers();
  }

  async get_server(uuid: string): Promise<ServerInfo> {
    return this.client.getServer(uuid);
  }

  async get_server_resources(uuid: string): Promise<ServerResources> {
    return this.client.getServerResources(uuid);
  }

  async get_server_domains(uuid: string): Promise<ServerDomain[]> {
    return this.client.getServerDomains(uuid);
  }

  async validate_server(uuid: string): Promise<ValidationResponse> {
    return this.client.validateServer(uuid);
  }

  async list_projects(): Promise<Project[]> {
    return this.client.listProjects();
  }

  async get_project(uuid: string): Promise<Project> {
    return this.client.getProject(uuid);
  }

  async create_project(project: CreateProjectRequest): Promise<{ uuid: string }> {
    return this.client.createProject(project);
  }

  async update_project(uuid: string, project: UpdateProjectRequest): Promise<Project> {
    return this.client.updateProject(uuid, project);
  }

  async delete_project(uuid: string): Promise<{ message: string }> {
    return this.client.deleteProject(uuid);
  }

  async get_project_environment(
    projectUuid: string,
    environmentNameOrUuid: string,
  ): Promise<Environment> {
    return this.client.getProjectEnvironment(projectUuid, environmentNameOrUuid);
  }

  async deploy_application(params: { uuid: string }): Promise<Deployment> {
    return this.client.deployApplication(params.uuid);
  }

  async list_databases(): Promise<Database[]> {
    return this.client.listDatabases();
  }

  async get_database(uuid: string): Promise<Database> {
    return this.client.getDatabase(uuid);
  }

  async update_database(uuid: string, data: DatabaseUpdateRequest): Promise<Database> {
    return this.client.updateDatabase(uuid, data);
  }

  async delete_database(
    uuid: string,
    options?: {
      deleteConfigurations?: boolean;
      deleteVolumes?: boolean;
      dockerCleanup?: boolean;
      deleteConnectedNetworks?: boolean;
    },
  ): Promise<{ message: string }> {
    return this.client.deleteDatabase(uuid, options);
  }

  async list_services(): Promise<Service[]> {
    return this.client.listServices();
  }

  async get_service(uuid: string): Promise<Service> {
    return this.client.getService(uuid);
  }

  async create_service(data: CreateServiceRequest): Promise<{ uuid: string; domains: string[] }> {
    return this.client.createService(data);
  }

  async delete_service(uuid: string, options?: DeleteServiceOptions): Promise<{ message: string }> {
    return this.client.deleteService(uuid, options);
  }
}
