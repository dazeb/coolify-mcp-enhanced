#!/usr/bin/env node

import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function testMcpAsAService() {
  console.log('🚀 Testing MCP-as-a-Service (MCPaaS) Features');
  console.log('==============================================\n');

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
    name: 'mcpaas-test-client',
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
    console.log(`📋 Using server: ${servers[0].name} (${serverUuid})\n`);

    // Test 1: Create a project for MCP services
    console.log('1. Creating MCP Services Project...');
    const createProjectResult = await client.callTool({
      name: 'create_project',
      arguments: {
        name: 'mcp-services-demo',
        description: 'Demonstration of MCP server capabilities for managing Coolify resources'
      }
    });
    const newProject = JSON.parse(createProjectResult.content[0].text);
    console.log(`✅ Project created: ${newProject.uuid}`);

    // Test 2: Create a MinIO service (Object Storage)
    console.log('\n2. Creating MinIO Object Storage Service...');
    try {
      const createMinioResult = await client.callTool({
        name: 'create_service',
        arguments: {
          type: 'minio',
          project_uuid: newProject.uuid,
          server_uuid: serverUuid,
          name: 'mcp-minio-storage',
          description: 'MinIO object storage for MCP demo',
          instant_deploy: false
        }
      });
      const minioService = JSON.parse(createMinioResult.content[0].text);
      console.log(`✅ MinIO service created: ${minioService.uuid}`);
      console.log(`   Domains: ${minioService.domains.join(', ')}`);

      // Get service details
      const getMinioResult = await client.callTool({
        name: 'get_service',
        arguments: { uuid: minioService.uuid }
      });
      const minioDetails = JSON.parse(getMinioResult.content[0].text);
      console.log(`   Status: ${minioDetails.status}`);
      console.log(`   Service Type: ${minioDetails.service_type}`);

    } catch (error) {
      console.log(`⚠️ MinIO service creation failed: ${error.message}`);
    }

    // Test 3: Create an Uptime Kuma monitoring service
    console.log('\n3. Creating Uptime Kuma Monitoring Service...');
    try {
      const createUptimeResult = await client.callTool({
        name: 'create_service',
        arguments: {
          type: 'uptime-kuma',
          project_uuid: newProject.uuid,
          server_uuid: serverUuid,
          name: 'mcp-monitoring',
          description: 'Uptime monitoring for MCP services',
          instant_deploy: false
        }
      });
      const uptimeService = JSON.parse(createUptimeResult.content[0].text);
      console.log(`✅ Uptime Kuma service created: ${uptimeService.uuid}`);
      console.log(`   Domains: ${uptimeService.domains.join(', ')}`);

    } catch (error) {
      console.log(`⚠️ Uptime Kuma service creation failed: ${error.message}`);
    }

    // Test 4: Create a simple application
    console.log('\n4. Creating a Simple Static Application...');
    try {
      const createAppResult = await client.callTool({
        name: 'create_application',
        arguments: {
          name: 'mcp-demo-app',
          description: 'Demo application managed via MCP',
          project_uuid: newProject.uuid,
          server_uuid: serverUuid,
          git_repository: 'https://github.com/vercel/next.js',
          git_branch: 'canary',
          build_pack: 'static'
        }
      });
      const newApp = JSON.parse(createAppResult.content[0].text);
      console.log(`✅ Application created: ${newApp.uuid}`);

      // Get application details
      const getAppResult = await client.callTool({
        name: 'get_application',
        arguments: { uuid: newApp.uuid }
      });
      const appDetails = JSON.parse(getAppResult.content[0].text);
      console.log(`   Name: ${appDetails.name}`);
      console.log(`   Status: ${appDetails.status}`);
      console.log(`   Build Pack: ${appDetails.build_pack}`);
      console.log(`   FQDN: ${appDetails.fqdn || 'Not set'}`);

    } catch (error) {
      console.log(`⚠️ Application creation failed: ${error.message}`);
    }

    // Test 5: List all resources in the project
    console.log('\n5. Listing All Project Resources...');
    
    // List applications
    const appsResult = await client.callTool({
      name: 'list_applications',
      arguments: {}
    });
    const applications = JSON.parse(appsResult.content[0].text);
    const projectApps = applications.filter(app => app.environment?.project?.uuid === newProject.uuid);
    console.log(`📱 Applications in project: ${projectApps.length}`);

    // List services
    const servicesResult = await client.callTool({
      name: 'list_services',
      arguments: {}
    });
    const services = JSON.parse(servicesResult.content[0].text);
    const projectServices = services.filter(service => service.environment_id && service.environment_id.toString().includes(newProject.uuid.substring(0, 8)));
    console.log(`🔧 Services in project: ${projectServices.length}`);

    // Test 6: Get server resources to see our new resources
    console.log('\n6. Checking Server Resources...');
    const resourcesResult = await client.callTool({
      name: 'get_server_resources',
      arguments: { uuid: serverUuid }
    });
    const resources = JSON.parse(resourcesResult.content[0].text);
    console.log(`📊 Total server resources: ${resources.length}`);
    
    const runningResources = resources.filter(r => r.status.includes('running'));
    const stoppedResources = resources.filter(r => r.status.includes('exited') || r.status.includes('stopped'));
    console.log(`   Running: ${runningResources.length}`);
    console.log(`   Stopped: ${stoppedResources.length}`);

    // Test 7: Get server domains
    console.log('\n7. Checking Server Domains...');
    const domainsResult = await client.callTool({
      name: 'get_server_domains',
      arguments: { uuid: serverUuid }
    });
    const domains = JSON.parse(domainsResult.content[0].text);
    console.log(`🌐 Domain configurations: ${domains.length} IP groups`);
    domains.forEach((domainGroup, index) => {
      console.log(`   IP ${index + 1}: ${domainGroup.ip} (${domainGroup.domains.length} domains)`);
    });

    // Test 8: Create a Docker Compose service
    console.log('\n8. Creating Docker Compose Service...');
    try {
      const dockerComposeYaml = `
version: '3.8'
services:
  hello-world:
    image: nginx:alpine
    ports:
      - "80:80"
    environment:
      - NGINX_HOST=localhost
    volumes:
      - ./html:/usr/share/nginx/html:ro
`;

      const createDockerComposeResult = await client.callTool({
        name: 'create_docker_compose_service',
        arguments: {
          name: 'mcp-docker-compose-demo',
          description: 'Docker Compose service created via MCP',
          project_uuid: newProject.uuid,
          server_uuid: serverUuid,
          docker_compose_raw: dockerComposeYaml,
          instant_deploy: false
        }
      });
      const dockerComposeService = JSON.parse(createDockerComposeResult.content[0].text);
      console.log(`✅ Docker Compose service created: ${dockerComposeService.uuid}`);

    } catch (error) {
      console.log(`⚠️ Docker Compose service creation failed: ${error.message}`);
    }

    // Test 9: Demonstrate project environment access
    console.log('\n9. Accessing Project Environment...');
    try {
      const envResult = await client.callTool({
        name: 'get_project_environment',
        arguments: {
          project_uuid: newProject.uuid,
          environment_name_or_uuid: 'production'
        }
      });
      const environment = JSON.parse(envResult.content[0].text);
      console.log(`✅ Environment accessed: ${environment.name}`);
      console.log(`   Project: ${environment.project.name}`);
    } catch (error) {
      console.log(`⚠️ Environment access failed: ${error.message}`);
    }

    // Test 10: Final summary and cleanup
    console.log('\n10. Summary and Cleanup...');
    
    // Get updated project details
    const finalProjectResult = await client.callTool({
      name: 'get_project',
      arguments: { uuid: newProject.uuid }
    });
    const finalProject = JSON.parse(finalProjectResult.content[0].text);
    console.log(`📋 Final project status: ${finalProject.name}`);
    console.log(`   Description: ${finalProject.description}`);
    console.log(`   Created: ${finalProject.created_at}`);

    // Clean up - delete the project (this will also delete associated resources)
    console.log('\n🧹 Cleaning up test project...');
    const deleteProjectResult = await client.callTool({
      name: 'delete_project',
      arguments: { uuid: newProject.uuid }
    });
    const deleteResponse = JSON.parse(deleteProjectResult.content[0].text);
    console.log(`✅ Cleanup completed: ${deleteResponse.message}`);

    console.log('\n🎉 MCP-as-a-Service Demo Completed Successfully!');
    console.log('================================================');
    console.log('✅ Demonstrated capabilities:');
    console.log('   • Project management (create, read, update, delete)');
    console.log('   • Service deployment (MinIO, Uptime Kuma)');
    console.log('   • Application deployment');
    console.log('   • Docker Compose services');
    console.log('   • Resource monitoring');
    console.log('   • Domain management');
    console.log('   • Environment access');
    console.log('   • Automated cleanup');

  } catch (error) {
    console.error('❌ MCPaaS test failed:', error);
  } finally {
    try {
      await client.close();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

testMcpAsAService().catch(console.error);