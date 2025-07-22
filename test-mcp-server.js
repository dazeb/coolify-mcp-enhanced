#!/usr/bin/env node

import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function testMcpServer() {
  console.log('🚀 Starting MCP Server Test Suite');
  console.log('=====================================\n');

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
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    console.log('1. Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected successfully!\n');

    console.log('2. Testing server capabilities...');
    const capabilities = client.getServerCapabilities();
    console.log('✅ Server capabilities:', JSON.stringify(capabilities, null, 2));
    console.log();

    console.log('3. Listing available tools...');
    const tools = await client.listTools();
    console.log(`✅ Found ${tools.tools.length} tools:`);
    tools.tools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool.name} - ${tool.description}`);
    });
    console.log();

    // Test basic server operations
    console.log('4. Testing list_servers tool...');
    try {
      const serversResult = await client.callTool({
        name: 'list_servers',
        arguments: {}
      });
      const servers = JSON.parse(serversResult.content[0].text);
      console.log(`✅ Retrieved ${servers.length} servers`);
      if (servers.length > 0) {
        console.log(`   First server: ${servers[0].name} (${servers[0].uuid})`);
      }
    } catch (error) {
      console.log('❌ list_servers failed:', error.message);
    }
    console.log();

    // Test project operations
    console.log('5. Testing list_projects tool...');
    try {
      const projectsResult = await client.callTool({
        name: 'list_projects',
        arguments: {}
      });
      const projects = JSON.parse(projectsResult.content[0].text);
      console.log(`✅ Retrieved ${projects.length} projects`);
      if (projects.length > 0) {
        console.log(`   First project: ${projects[0].name} (${projects[0].uuid})`);
      }
    } catch (error) {
      console.log('❌ list_projects failed:', error.message);
    }
    console.log();

    // Test application operations
    console.log('6. Testing list_applications tool...');
    try {
      const appsResult = await client.callTool({
        name: 'list_applications',
        arguments: {}
      });
      const applications = JSON.parse(appsResult.content[0].text);
      console.log(`✅ Retrieved ${applications.length} applications`);
      if (applications.length > 0) {
        console.log(`   First application: ${applications[0].name} (${applications[0].uuid})`);
        console.log(`   Status: ${applications[0].status}`);
        console.log(`   FQDN: ${applications[0].fqdn}`);
      }
    } catch (error) {
      console.log('❌ list_applications failed:', error.message);
    }
    console.log();

    // Test service operations
    console.log('7. Testing list_services tool...');
    try {
      const servicesResult = await client.callTool({
        name: 'list_services',
        arguments: {}
      });
      const services = JSON.parse(servicesResult.content[0].text);
      console.log(`✅ Retrieved ${services.length} services`);
      if (services.length > 0) {
        console.log(`   First service: ${services[0].name} (${services[0].uuid})`);
        console.log(`   Status: ${services[0].status}`);
        console.log(`   Type: ${services[0].service_type}`);
      }
    } catch (error) {
      console.log('❌ list_services failed:', error.message);
    }
    console.log();

    // Test database operations
    console.log('8. Testing list_databases tool...');
    try {
      const dbsResult = await client.callTool({
        name: 'list_databases',
        arguments: {}
      });
      const databases = JSON.parse(dbsResult.content[0].text);
      console.log(`✅ Retrieved ${databases.length} databases`);
      if (databases.length > 0) {
        console.log(`   First database: ${databases[0].name} (${databases[0].uuid})`);
      }
    } catch (error) {
      console.log('❌ list_databases failed:', error.message);
    }
    console.log();

    // Test server-specific operations if we have servers
    const serversResult = await client.callTool({
      name: 'list_servers',
      arguments: {}
    });
    const servers = JSON.parse(serversResult.content[0].text);
    
    if (servers.length > 0) {
      const serverUuid = servers[0].uuid;
      
      console.log(`9. Testing get_server for server: ${serverUuid}...`);
      try {
        const serverResult = await client.callTool({
          name: 'get_server',
          arguments: { uuid: serverUuid }
        });
        const server = JSON.parse(serverResult.content[0].text);
        console.log(`✅ Server details retrieved: ${server.name}`);
        console.log(`   IP: ${server.ip}, Port: ${server.port}`);
        console.log(`   Status: ${server.proxy?.status || 'unknown'}`);
      } catch (error) {
        console.log('❌ get_server failed:', error.message);
      }
      console.log();

      console.log(`10. Testing get_server_resources for server: ${serverUuid}...`);
      try {
        const resourcesResult = await client.callTool({
          name: 'get_server_resources',
          arguments: { uuid: serverUuid }
        });
        const resources = JSON.parse(resourcesResult.content[0].text);
        console.log(`✅ Server resources retrieved: ${resources.length} resources`);
        if (resources.length > 0) {
          console.log(`   First resource: ${resources[0].name} (${resources[0].type})`);
        }
      } catch (error) {
        console.log('❌ get_server_resources failed:', error.message);
      }
      console.log();

      console.log(`11. Testing get_server_domains for server: ${serverUuid}...`);
      try {
        const domainsResult = await client.callTool({
          name: 'get_server_domains',
          arguments: { uuid: serverUuid }
        });
        const domains = JSON.parse(domainsResult.content[0].text);
        console.log(`✅ Server domains retrieved: ${domains.length} domain groups`);
        if (domains.length > 0) {
          console.log(`   First IP: ${domains[0].ip} with ${domains[0].domains.length} domains`);
        }
      } catch (error) {
        console.log('❌ get_server_domains failed:', error.message);
      }
      console.log();
    }

    // Test application-specific operations if we have applications
    const appsResult = await client.callTool({
      name: 'list_applications',
      arguments: {}
    });
    const applications = JSON.parse(appsResult.content[0].text);
    
    if (applications.length > 0) {
      const appUuid = applications[0].uuid;
      
      console.log(`12. Testing get_application for app: ${appUuid}...`);
      try {
        const appResult = await client.callTool({
          name: 'get_application',
          arguments: { uuid: appUuid }
        });
        const app = JSON.parse(appResult.content[0].text);
        console.log(`✅ Application details retrieved: ${app.name}`);
        console.log(`   Git repo: ${app.git_repository || 'N/A'}`);
        console.log(`   Build pack: ${app.build_pack || 'N/A'}`);
      } catch (error) {
        console.log('❌ get_application failed:', error.message);
      }
      console.log();

      console.log(`13. Testing get_application_environment_variables for app: ${appUuid}...`);
      try {
        const envResult = await client.callTool({
          name: 'get_application_environment_variables',
          arguments: { uuid: appUuid }
        });
        const envVars = JSON.parse(envResult.content[0].text);
        console.log(`✅ Environment variables retrieved: ${envVars.length} variables`);
        if (envVars.length > 0) {
          console.log(`   First variable: ${envVars[0].key}`);
        }
      } catch (error) {
        console.log('❌ get_application_environment_variables failed:', error.message);
      }
      console.log();

      console.log(`14. Testing get_deployments for app: ${appUuid}...`);
      try {
        const deploymentsResult = await client.callTool({
          name: 'get_deployments',
          arguments: { application_uuid: appUuid }
        });
        const deployments = JSON.parse(deploymentsResult.content[0].text);
        console.log(`✅ Deployments retrieved: ${deployments.length} deployments`);
        if (deployments.length > 0) {
          console.log(`   Latest deployment: ${deployments[0].uuid} (${deployments[0].status})`);
        }
      } catch (error) {
        console.log('❌ get_deployments failed:', error.message);
      }
      console.log();
    }

    console.log('🎉 MCP Server Test Suite Completed Successfully!');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    try {
      await client.close();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

testMcpServer().catch(console.error);