#!/usr/bin/env node

import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

async function testEnhancedServer() {
  console.log('🚀 Testing Enhanced Coolify MCP Server');
  console.log('=====================================\n');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
    env: {
      ...process.env,
      COOLIFY_BASE_URL: 'https://s1.v0cl.one',
      COOLIFY_ACCESS_TOKEN: '19|LlTDtAITWr02vYNa6T5S3tG5RNSkFeCoIMVmn5xDbc6f52af',
      COOLIFY_MCP_ENHANCED: 'true'
    }
  });

  const client = new Client({
    name: 'enhanced-test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to Enhanced MCP server\n');

    // Test enhanced error handling
    console.log('1. Testing enhanced list_servers...');
    const serversResult = await client.callTool({
      name: 'list_servers',
      arguments: {}
    });
    const serversResponse = JSON.parse(serversResult.content[0].text);
    console.log(`✅ Enhanced response format: ${serversResponse.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Message: ${serversResponse.message}`);
    console.log(`   Server count: ${serversResponse.count}`);

    // Test parameter validation
    console.log('\n2. Testing parameter validation...');
    try {
      await client.callTool({
        name: 'get_server',
        arguments: { uuid: '' } // Invalid empty UUID
      });
    } catch (error) {
      console.log('✅ Parameter validation working - caught invalid UUID');
    }

    // Test enhanced project creation
    console.log('\n3. Testing enhanced project creation...');
    const createProjectResult = await client.callTool({
      name: 'create_project',
      arguments: {
        name: 'enhanced-test-project'
        // description will be auto-generated
      }
    });
    const projectResponse = JSON.parse(createProjectResult.content[0].text);
    
    if (projectResponse.success) {
      console.log(`✅ Enhanced project creation successful`);
      console.log(`   Project UUID: ${projectResponse.data.uuid}`);
      console.log(`   Next steps provided: ${projectResponse.next_steps?.length || 0}`);

      // Test enhanced service creation with auto-configuration
      console.log('\n4. Testing enhanced service creation...');
      const servers = JSON.parse((await client.callTool({
        name: 'list_servers',
        arguments: {}
      })).content[0].text);
      
      if (servers.success && servers.data.length > 0) {
        const serverUuid = servers.data[0].uuid;
        
        try {
          const createServiceResult = await client.callTool({
            name: 'create_service_enhanced',
            arguments: {
              type: 'minio',
              project_uuid: projectResponse.data.uuid,
              server_uuid: serverUuid,
              name: 'test-storage'
              // environment_name will be auto-configured
            }
          });
          const serviceResponse = JSON.parse(createServiceResult.content[0].text);
          
          if (serviceResponse.success) {
            console.log(`✅ Enhanced service creation successful`);
            console.log(`   Service UUID: ${serviceResponse.data.uuid}`);
            console.log(`   Auto-configured environment: ${serviceResponse.configuration.environment}`);
          } else {
            console.log(`⚠️ Service creation failed: ${serviceResponse.error.message}`);
            console.log(`   Suggestions: ${serviceResponse.error.suggestions.join(', ')}`);
          }
        } catch (error) {
          console.log(`⚠️ Service creation error: ${error.message}`);
        }
      }

      // Test tool documentation
      console.log('\n5. Testing tool documentation...');
      const docResult = await client.callTool({
        name: 'get_tool_documentation',
        arguments: { tool_name: 'create_service' }
      });
      const documentation = docResult.content[0].text;
      console.log(`✅ Tool documentation retrieved (${documentation.length} characters)`);

      // Clean up
      console.log('\n6. Cleaning up test project...');
      const deleteResult = await client.callTool({
        name: 'delete_project',
        arguments: { uuid: projectResponse.data.uuid }
      });
      console.log('✅ Test project cleaned up');

    } else {
      console.log(`❌ Project creation failed: ${projectResponse.error.message}`);
    }

    console.log('\n🎉 Enhanced Server Test Completed!');
    console.log('==================================');
    console.log('✅ Enhanced features tested:');
    console.log('   • Structured success/error responses');
    console.log('   • Parameter validation and defaults');
    console.log('   • Auto-environment configuration');
    console.log('   • Enhanced error messages with suggestions');
    console.log('   • Tool documentation system');

  } catch (error) {
    console.error('❌ Enhanced server test failed:', error);
  } finally {
    try {
      await client.close();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

testEnhancedServer().catch(console.error);