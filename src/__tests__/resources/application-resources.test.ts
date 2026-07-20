import { ApplicationResources } from '../../resources/application-resources.js';
import { CoolifyClient } from '../../lib/coolify-client.js';
import { jest } from '@jest/globals';

jest.mock('../../lib/coolify-client.js');

describe('ApplicationResources', () => {
  let resources: ApplicationResources;
  let mockClient: jest.Mocked<CoolifyClient>;

  beforeEach(() => {
    mockClient = {
      listApplications: jest.fn(),
      getApplication: jest.fn(),
      createApplication: jest.fn(),
      deleteApplication: jest.fn(),
    } as unknown as jest.Mocked<CoolifyClient>;

    resources = new ApplicationResources(mockClient);
  });

  describe('listApplications', () => {
    it('delegates to client.listApplications', async () => {
      mockClient.listApplications.mockResolvedValue([{ uuid: 'a1', name: 'app' }] as never);
      await expect(resources.listApplications()).resolves.toEqual([{ uuid: 'a1', name: 'app' }]);
    });
  });

  describe('getApplication', () => {
    it('delegates to client.getApplication', async () => {
      mockClient.getApplication.mockResolvedValue({ uuid: 'a1', name: 'app' } as never);
      await expect(resources.getApplication('a1')).resolves.toEqual({ uuid: 'a1', name: 'app' });
    });
  });

  describe('createApplication', () => {
    it('delegates to client.createApplication', async () => {
      mockClient.createApplication.mockResolvedValue({ uuid: 'new' });
      await expect(
        resources.createApplication({
          name: 'test-app',
          project_uuid: 'test-project-uuid',
          server_uuid: 'test-server-uuid',
        })
      ).resolves.toEqual({ uuid: 'new' });
    });
  });

  describe('deleteApplication', () => {
    it('delegates to client.deleteApplication', async () => {
      mockClient.deleteApplication.mockResolvedValue({ message: 'ok' });
      await expect(resources.deleteApplication('a1')).resolves.toEqual({ message: 'ok' });
    });
  });
});
