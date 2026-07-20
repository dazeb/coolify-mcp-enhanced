import { DeploymentResources } from '../../resources/deployment-resources.js';
import { CoolifyClient } from '../../lib/coolify-client.js';
import { jest } from '@jest/globals';

jest.mock('../../lib/coolify-client.js');

describe('DeploymentResources', () => {
  let mockClient: jest.Mocked<CoolifyClient>;
  let resources: DeploymentResources;
  const mockDeployment = {
    id: 1,
    uuid: 'test-uuid',
    status: 'running',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    application_uuid: 'app-uuid',
    environment_uuid: 'env-uuid',
  };

  beforeEach(() => {
    mockClient = {
      deployApplication: jest.fn(),
      getDeployment: jest.fn(),
    } as unknown as jest.Mocked<CoolifyClient>;
    resources = new DeploymentResources(mockClient);
  });

  describe('getDeployment', () => {
    it('delegates to client.getDeployment', async () => {
      mockClient.getDeployment.mockResolvedValue(mockDeployment as never);
      await expect(resources.getDeployment('test-id')).resolves.toEqual(mockDeployment);
    });
  });

  describe('deploy', () => {
    it('should deploy an application', async () => {
      mockClient.deployApplication.mockResolvedValue(mockDeployment as never);

      const result = await resources.deploy({ uuid: 'test-uuid' });

      expect(result).toEqual(mockDeployment);
      expect(mockClient.deployApplication).toHaveBeenCalledWith('test-uuid');
    });

    it('should handle deployment errors', async () => {
      const error = new Error('Deployment failed');
      mockClient.deployApplication.mockRejectedValue(error);

      await expect(resources.deploy({ uuid: 'test-uuid' })).rejects.toThrow('Deployment failed');
      expect(mockClient.deployApplication).toHaveBeenCalledWith('test-uuid');
    });
  });
});
