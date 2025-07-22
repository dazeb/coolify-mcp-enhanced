#!/usr/bin/env node

import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function testAdvancedFeatures() {
  console.log('🚀 Testing Advanced MCP Server Features');
  console.log('=======================================\n');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    env: {
      ...process.env,
      COOLIFY_BASE_URL: 'https://s1.v0cl.one',
      COOLIFY_ACCESS_TOKEN: '19|LlTDtAITWr02vYNa6T5S3tG5RNSkFeCoIMVmn5xDbc6f52af'
    }
  });

  const client = new Client({
    name: 'advanced-test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // Get server info for later use
    const serversResult = await client.callTool({
      name: 'list_servers',
      arguments: {}
    });
    const servers = JSON.parse(serversResult.content[0].text);
    const serverUuid = servers[0].uuid;

    // Test 1: Create a new project
    console.log('1. Testing create_project...');
    try {
      const createProjectResult = await client.callTool({
        name: 'create_project',
        arguments: {
          name: 'mcp-test-project',
          description: 'Test project created via MCP'
        }
      });
      const newProject = JSON.parse(createProjectResult.content[0].text);
      console.log(`✅ Project created successfully: ${newProject.uuid}`);
      
      // Test 2: Update the project
      console.log('2. Testing update_project...');
      const updateProjectResult = await client.callTool({
        name: 'update_project',
        arguments: {
          uuid: newProject.uuid,
          name: 'mcp-test-project-updated',
          description: 'Updated test project via MCP'
        }
      });
      const updatedProject = JSON.parse(updateProjectResult.content[0].text);
      console.log(`✅ Project updated successfully: ${updatedProject.name}`);

      // Test 3: Get project details
      console.log('3. Testing get_project...');
      const getProjectResult = await client.callTool({
        name: 'get_project',
        arguments: {
          uuid: newProject.uuid
        }
      });
      const projectDetails = JSON.parse(getProjectResult.content[0].text);
      console.log(`✅ Project details retrieved: ${projectDetails.name}`);

      // Test 4: Create a service in the project
      console.log('4. Testing create_service (PostgreSQL)...');
      try {
        const createServiceResult = await client.callTool({
          name: 'create_service',
          arguments: {
            type: 'postgresql',
            project_uuid: newProject.uuid,
            server_uuid: serverUuid,
            name: 'test-postgres',
            description: 'Test PostgreSQL service via MCP',
            instant_deploy: false
          }
        });
        const newService = JSON.parse(createServiceResult.content[0].text);
        console.log(`✅ PostgreSQL service created: ${newService.uuid}`);
        console.log(`   Domains: ${newService.domains.join(', ')}`);

        // Test 5: Get service details
        console.log('5. Testing get_service...');
        const getServiceResult = await client.callTool({
          name: 'get_service',
          arguments: {
            uuid: newService.uuid
          }
        });
        const serviceDetails = JSON.parse(getServiceResult.content[0].text);
        console.log(`✅ Service details retrieved: ${serviceDetails.name}`);
        console.log(`   Status: ${serviceDetails.status}`);

        // Test 6: Delete the service
        console.log('6. Testing delete_service...');
        const deleteServiceResult = await client.callTool({
          name: 'delete_service',
          arguments: {
            uuid: newService.uuid,
            options: {
              deleteConfigurations: true,
              deleteVolumes: true,
              dockerCleanup: true
            }
          }
        });
        const deleteServiceResponse = JSON.parse(deleteServiceResult.content[0].text);
        console.log(`✅ Service deleted: ${deleteServiceResponse.message}`);

      } catch (error) {
        console.log(`⚠️ Service operations failed: ${error.message}`);
      }

      // Test 7: Create an application
      console.log('7. Testing create_application...');
      try {
        const createAppResult = await client.callTool({
          name: 'create_application',
          arguments: {
            name: 'test-app',
            description: 'Test application via MCP',
            project_uuid: newProject.uuid,
            server_uuid: serverUuid,
            git_repository: 'https://github.com/vercel/next.js',
            git_branch: 'canary',
            build_pack: 'nixpacks'
          }
        });
        const newApp = JSON.parse(createAppResult.content[0].text);
        console.log(`✅ Application created: ${newApp.uuid}`);

        // Test 8: Get application details
        console.log('8. Testing get_application...');
        const getAppResult = await client.callTool({
          name: 'get_application',
          arguments: {
            uuid: newApp.uuid
          }
        });
        const appDetails = JSON.parse(getAppResult.content[0].text);
        console.log(`✅ Application details retrieved: ${appDetails.name}`);
        console.log(`   Git repo: ${appDetails.git_repository}`);
        console.log(`   Build pack: ${appDetails.build_pack}`);

        // Test 9: Update environment variables
        console.log('9. Testing update_application_environment_variables...');
        try {
          const updateEnvResult = await client.callTool({
            name: 'update_application_environment_variables',
            arguments: {
              uuid: newApp.uuid,
              variables: [
                {
                  key: 'NODE_ENV',
                  value: 'production',
                  is_preview: false,
                  is_build_time: true
                },
                {
                  key: 'API_URL',
                  value: 'https://api.example.com',
                  is_preview: false,
                  is_build_time: false
                }
              ]
            }
          });
          const envUpdateResponse = JSON.parse(updateEnvResult.content[0].text);
          console.log(`✅ Environment variables updated: ${envUpdateResponse.message}`);
        } catch (error) {
          console.log(`⚠️ Environment variables update failed: ${error.message}`);
        }

        // Test 10: Get environment variables
        console.log('10. Testing get_application_environment_variables...');
        try {
          const getEnvResult = await client.callTool({
            name: 'get_application_environment_variables',
            arguments: {
              uuid: newApp.uuid
            }
          });
          const envVars = JSON.parse(getEnvResult.content[0].text);
          console.log(`✅ Environment variables retrieved: ${envVars.length} variables`);
          const nodeEnvVar = envVars.find(v => v.key === 'NODE_ENV');
          if (nodeEnvVar) {
            console.log(`   NODE_ENV: ${nodeEnvVar.value}`);
          }
        } catch (error) {
          console.log(`⚠️ Get environment variables failed: ${error.message}`);
        }

        // Test 11: Delete the application
        console.log('11. Testing delete_application...');
        const deleteAppResult = await client.callTool({
          name: 'delete_application',
          arguments: {
            uuid: newApp.uuid,
            options: {
              deleteConfigurations: true,
              deleteVolumes: true,
              dockerCleanup: true
            }
          }
        });
        const deleteAppResponse = JSON.parse(deleteAppResult.content[0].text);
        console.log(`✅ Application deleted: ${deleteAppResponse.message}`);

      } catch (error) {
        console.log(`⚠️ Application operations failed: ${error.message}`);
      }

      // Test 12: Delete the project
      console.log('12. Testing delete_project...');
      const deleteProjectResult = await client.callTool({
        name: 'delete_project',
        arguments: {
          uuid: newProject.uuid
        }
      });
      const deleteProjectResponse = JSON.parse(deleteProjectResult.content[0].text);
      console.log(`✅ Project deleted: ${deleteProjectResponse.message}`);

    } catch (error) {
      console.log(`❌ Project operations failed: ${error.message}`);
    }

    // Test 13: Test full-stack project creation
    console.log('\n13. Testing create_fullstack_project...');
    try {
      const fullStackResult = await client.callTool({
        name: 'create_fullstack_project',
        arguments: {
          name: 'fullstack-test',
          description: 'Full-stack test project via MCP',
          server_uuid: serverUuid
        }
      });
      const fullStackProject = JSON.parse(fullStackResult.content[0].text);
      console.log(`✅ Full-stack project created: ${fullStackProject.project_uuid}`);
      console.log(`   Status: ${fullStackProject.status}`);

      // Test 14: Deploy infrastructure stack
      console.log('14. Testing deploy_infrastructure_stack...');
      try {
        const infraResult = await client.callTool({
          name: 'deploy_infrastructure_stack',
          arguments: {
            project_uuid: fullStackProject.project_uuid,
            server_uuid: serverUuid,
            include_postgres: true,
            include_redis: true,
            include_minio: false
          }
        });
        const infraResponse = JSON.parse(infraResult.content[0].text);
        console.log(`✅ Infrastructure deployed: ${infraResponse.status}`);
        console.log(`   Services created: ${infraResponse.services.length}`);
        console.log(`   Message: ${infraResponse.message}`);

        // Clean up the full-stack project
        console.log('15. Cleaning up full-stack project...');
        const deleteFullStackResult = await client.callTool({
          name: 'delete_project',
          arguments: {
            uuid: fullStackProject.project_uuid
          }
        });
        const deleteFullStackResponse = JSON.parse(deleteFullStackResult.content[0].text);
        console.log(`✅ Full-stack project deleted: ${deleteFullStackResponse.message}`);

      } catch (error) {
        console.log(`⚠️ Infrastructure deployment failed: ${error.message}`);
      }
    } catch (error) {
      console.log(`⚠️ Full-stack project creation failed: ${error.message}`);
    }

    // Test 16: Test server validation
    console.log('\n16. Testing validate_server...');
    try {
      const validateResult = await client.callTool({
        name: 'validate_server',
        arguments: {
          uuid: serverUuid
        }
      });
      const validation = JSON.parse(validateResult.content[0].text);
      console.log(`✅ Server validation completed`);
      console.log(`   Validation result: ${JSON.stringify(validation, null, 2)}`);
    } catch (error) {
      console.log(`⚠️ Server validation failed: ${error.message}`);
    }

    console.log('\n🎉 Advanced Features Test Completed!');
    console.log('====================================');

  } catch (error) {
    console.error('❌ Advanced test suite failed:', error);
  } finally {
    try {
      await client.close();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

testAdvancedFeatures().catch(console.error);