import { CoolifyClient } from '../lib/coolify-client.js';
import { Resource } from '../lib/resource.js';
import { Application, CreateApplicationRequest } from '../types/coolify.js';

export class ApplicationResources {
  private client: CoolifyClient;

  constructor(client: CoolifyClient) {
    this.client = client;
  }

  @Resource('coolify/applications/list')
  async listApplications(): Promise<Application[]> {
    return this.client.listApplications();
  }

  @Resource('coolify/applications/{id}')
  async getApplication(id: string): Promise<Application> {
    return this.client.getApplication(id);
  }

  @Resource('coolify/applications/create')
  async createApplication(data: CreateApplicationRequest): Promise<{ uuid: string }> {
    return this.client.createApplication(data);
  }

  @Resource('coolify/applications/{id}/delete')
  async deleteApplication(id: string): Promise<{ message: string }> {
    return this.client.deleteApplication(id);
  }
}
