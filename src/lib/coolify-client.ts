import {
  CoolifyConfig,
  ErrorResponse,
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
  Application,
  CreateApplicationRequest,
  EnvironmentVariable,
  EnvironmentVariableUpdate,
  CreateDockerComposeServiceRequest,
  UpdateDockerComposeServiceRequest,
  ApplicationResources,
  LogOptions,
  LogEntry,
  CreateMCPaaSProjectRequest,
  MCPaaSProjectResponse,
  MCPaaSDeploymentConfig,
  MCPaaSDeploymentResponse,
} from '../types/coolify.js';

export class CoolifyClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(config: CoolifyConfig) {
    if (!config.baseUrl) {
      throw new Error('Coolify base URL is required');
    }
    if (!config.accessToken) {
      throw new Error('Coolify access token is required');
    }
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.accessToken = config.accessToken;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    try {
      const url = `${this.baseUrl}/api/v1${path}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as ErrorResponse;
        throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data as T;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          `Failed to connect to Coolify server at ${this.baseUrl}. Please check if the server is running and the URL is correct.`,
        );
      }
      throw error;
    }
  }

  async listServers(): Promise<ServerInfo[]> {
    return this.request<ServerInfo[]>('/servers');
  }

  async getServer(uuid: string): Promise<ServerInfo> {
    return this.request<ServerInfo>(`/servers/${uuid}`);
  }

  async getServerResources(uuid: string): Promise<ServerResources> {
    return this.request<ServerResources>(`/servers/${uuid}/resources`);
  }

  async getServerDomains(uuid: string): Promise<ServerDomain[]> {
    return this.request<ServerDomain[]>(`/servers/${uuid}/domains`);
  }

  async validateServer(uuid: string): Promise<ValidationResponse> {
    return this.request<ValidationResponse>(`/servers/${uuid}/validate`);
  }

  async validateConnection(): Promise<void> {
    try {
      await this.listServers();
    } catch (error) {
      throw new Error(
        `Failed to connect to Coolify server: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async listProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(uuid: string): Promise<Project> {
    return this.request<Project>(`/projects/${uuid}`);
  }

  async createProject(project: CreateProjectRequest): Promise<{ uuid: string }> {
    return this.request<{ uuid: string }>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(uuid: string, project: UpdateProjectRequest): Promise<Project> {
    return this.request<Project>(`/projects/${uuid}`, {
      method: 'PATCH',
      body: JSON.stringify(project),
    });
  }

  async deleteProject(uuid: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/projects/${uuid}`, {
      method: 'DELETE',
    });
  }

  async getProjectEnvironment(
    projectUuid: string,
    environmentNameOrUuid: string,
  ): Promise<Environment> {
    return this.request<Environment>(`/projects/${projectUuid}/${environmentNameOrUuid}`);
  }

  async deployApplication(uuid: string): Promise<Deployment> {
    const response = await this.request<Deployment>(`/applications/${uuid}/deploy`, {
      method: 'POST',
    });
    return response;
  }

  async listDatabases(): Promise<Database[]> {
    return this.request<Database[]>('/databases');
  }

  async getDatabase(uuid: string): Promise<Database> {
    return this.request<Database>(`/databases/${uuid}`);
  }

  async updateDatabase(uuid: string, data: DatabaseUpdateRequest): Promise<Database> {
    return this.request<Database>(`/databases/${uuid}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDatabase(
    uuid: string,
    options?: {
      deleteConfigurations?: boolean;
      deleteVolumes?: boolean;
      dockerCleanup?: boolean;
      deleteConnectedNetworks?: boolean;
    },
  ): Promise<{ message: string }> {
    const queryParams = new URLSearchParams();
    if (options) {
      if (options.deleteConfigurations !== undefined) {
        queryParams.set('delete_configurations', options.deleteConfigurations.toString());
      }
      if (options.deleteVolumes !== undefined) {
        queryParams.set('delete_volumes', options.deleteVolumes.toString());
      }
      if (options.dockerCleanup !== undefined) {
        queryParams.set('docker_cleanup', options.dockerCleanup.toString());
      }
      if (options.deleteConnectedNetworks !== undefined) {
        queryParams.set('delete_connected_networks', options.deleteConnectedNetworks.toString());
      }
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/databases/${uuid}?${queryString}` : `/databases/${uuid}`;

    return this.request<{ message: string }>(url, {
      method: 'DELETE',
    });
  }

  async listServices(): Promise<Service[]> {
    return this.request<Service[]>('/services');
  }

  async getService(uuid: string): Promise<Service> {
    return this.request<Service>(`/services/${uuid}`);
  }

  async createService(data: CreateServiceRequest): Promise<{ uuid: string; domains: string[] }> {
    return this.request<{ uuid: string; domains: string[] }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteService(uuid: string, options?: DeleteServiceOptions): Promise<{ message: string }> {
    const queryParams = new URLSearchParams();
    if (options) {
      if (options.deleteConfigurations !== undefined) {
        queryParams.set('delete_configurations', options.deleteConfigurations.toString());
      }
      if (options.deleteVolumes !== undefined) {
        queryParams.set('delete_volumes', options.deleteVolumes.toString());
      }
      if (options.dockerCleanup !== undefined) {
        queryParams.set('docker_cleanup', options.dockerCleanup.toString());
      }
      if (options.deleteConnectedNetworks !== undefined) {
        queryParams.set('delete_connected_networks', options.deleteConnectedNetworks.toString());
      }
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/services/${uuid}?${queryString}` : `/services/${uuid}`;

    return this.request<{ message: string }>(url, {
      method: 'DELETE',
    });
  }

  // Application Management Methods
  async listApplications(): Promise<Application[]> {
    return this.request<Application[]>('/applications');
  }

  async getApplication(uuid: string): Promise<Application> {
    return this.request<Application>(`/applications/${uuid}`);
  }

  async createApplication(data: CreateApplicationRequest): Promise<{ uuid: string }> {
    return this.request<{ uuid: string }>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApplication(uuid: string, data: Partial<Application>): Promise<Application> {
    return this.request<Application>(`/applications/${uuid}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteApplication(uuid: string, options?: DeleteServiceOptions): Promise<{ message: string }> {
    const queryParams = new URLSearchParams();
    if (options) {
      if (options.deleteConfigurations !== undefined) {
        queryParams.set('delete_configurations', options.deleteConfigurations.toString());
      }
      if (options.deleteVolumes !== undefined) {
        queryParams.set('delete_volumes', options.deleteVolumes.toString());
      }
      if (options.dockerCleanup !== undefined) {
        queryParams.set('docker_cleanup', options.dockerCleanup.toString());
      }
      if (options.deleteConnectedNetworks !== undefined) {
        queryParams.set('delete_connected_networks', options.deleteConnectedNetworks.toString());
      }
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/applications/${uuid}?${queryString}` : `/applications/${uuid}`;

    return this.request<{ message: string }>(url, {
      method: 'DELETE',
    });
  }

  // Environment Variable Management
  async getApplicationEnvironmentVariables(uuid: string): Promise<EnvironmentVariable[]> {
    return this.request<EnvironmentVariable[]>(`/applications/${uuid}/envs`);
  }

  async updateApplicationEnvironmentVariables(
    uuid: string, 
    variables: EnvironmentVariableUpdate[]
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/applications/${uuid}/envs`, {
      method: 'POST',
      body: JSON.stringify(variables),
    });
  }

  // Docker Compose Service Management
  async createDockerComposeService(data: CreateDockerComposeServiceRequest): Promise<{ uuid: string }> {
    return this.request<{ uuid: string }>('/services/docker-compose', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDockerComposeService(
    uuid: string, 
    data: UpdateDockerComposeServiceRequest
  ): Promise<Service> {
    return this.request<Service>(`/services/${uuid}/docker-compose`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Deployment Management
  async getDeployments(applicationUuid: string): Promise<Deployment[]> {
    return this.request<Deployment[]>(`/applications/${applicationUuid}/deployments`);
  }

  async getDeployment(uuid: string): Promise<Deployment> {
    return this.request<Deployment>(`/deployments/${uuid}`);
  }

  async cancelDeployment(uuid: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/deployments/${uuid}/cancel`, {
      method: 'POST',
    });
  }

  // Resource Management
  async getApplicationResources(uuid: string): Promise<ApplicationResources> {
    return this.request<ApplicationResources>(`/applications/${uuid}/resources`);
  }

  async getApplicationLogs(uuid: string, options?: LogOptions): Promise<LogEntry[]> {
    const queryParams = new URLSearchParams();
    if (options?.since) queryParams.set('since', options.since);
    if (options?.until) queryParams.set('until', options.until);
    if (options?.lines) queryParams.set('lines', options.lines.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/applications/${uuid}/logs?${queryString}` : `/applications/${uuid}/logs`;
    
    return this.request<LogEntry[]>(url);
  }

  // MCPaaS Specific Methods
  async createMCPaaSProject(data: CreateMCPaaSProjectRequest): Promise<MCPaaSProjectResponse> {
    // Create project first
    const project = await this.createProject({
      name: data.name,
      description: data.description || 'MCPaaS Platform Deployment'
    });

    return {
      project_uuid: project.uuid,
      name: data.name,
      description: data.description,
      services: [],
      status: 'created'
    };
  }

  async deployMCPaaSStack(
    projectUuid: string, 
    serverUuid: string, 
    config: MCPaaSDeploymentConfig
  ): Promise<MCPaaSDeploymentResponse> {
    const services: string[] = [];

    try {
      // Deploy PostgreSQL
      if (config.includePostgres) {
        const postgres = await this.createService({
          type: 'postgresql',
          project_uuid: projectUuid,
          server_uuid: serverUuid,
          name: 'mcpaas-postgres',
          description: 'MCPaaS PostgreSQL Database'
        });
        services.push(postgres.uuid);
      }

      // Deploy Redis
      if (config.includeRedis) {
        const redis = await this.createService({
          type: 'redis',
          project_uuid: projectUuid,
          server_uuid: serverUuid,
          name: 'mcpaas-redis',
          description: 'MCPaaS Redis Cache'
        });
        services.push(redis.uuid);
      }

      // Deploy MinIO
      if (config.includeMinIO) {
        const minio = await this.createService({
          type: 'minio',
          project_uuid: projectUuid,
          server_uuid: serverUuid,
          name: 'mcpaas-minio',
          description: 'MCPaaS Object Storage'
        });
        services.push(minio.uuid);
      }

      return {
        project_uuid: projectUuid,
        services,
        status: 'deployed',
        message: 'MCPaaS stack deployed successfully'
      };
    } catch (error) {
      return {
        project_uuid: projectUuid,
        services,
        status: 'failed',
        message: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
