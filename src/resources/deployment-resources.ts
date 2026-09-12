import { Resource } from '../lib/resource.js';
import { CoolifyClient } from '../lib/coolify-client.js';
import { Deployment } from '../types/coolify.js';

export class DeploymentResources {
  private client: CoolifyClient;

  constructor(client: CoolifyClient) {
    this.client = client;
  }

  @Resource('coolify/deployments/{id}')
  async getDeployment(id: string): Promise<Deployment> {
    return this.client.getDeployment(id);
  }

  @Resource('coolify/deploy')
  async deploy(params: { uuid: string; forceRebuild?: boolean }): Promise<Deployment> {
    return this.client.deployApplication(params.uuid);
  }
}
