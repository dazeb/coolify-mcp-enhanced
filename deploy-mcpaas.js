#!/usr/bin/env node

// MCPaaS Deployment Script using Enhanced Coolify MCP Server
// This script automates the complete deployment of MCPaaS on Coolify

const { spawn } = require('child_process');
const readline = require('readline');

// Configuration
const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL || 'http://localhost:3000';
const COOLIFY_ACCESS_TOKEN = process.env.COOLIFY_ACCESS_TOKEN || '';
const MCPAAS_DOMAIN = process.env.MCPAAS_DOMAIN || 'mcpaas.example.com';
const GITHUB_REPO = process.env.GITHUB_REPO || 'https://github.com/your-username/mcpaas-v3.git';

if (!COOLIFY_ACCESS_TOKEN) {
  console.error('❌ COOLIFY_ACCESS_TOKEN environment variable is required');
  console.error('   Get your token from Coolify Dashboard > API Tokens');
  process.exit(1);
}

console.log('🚀 MCPaaS Deployment Script');
console.log('===========================');
console.log(`Coolify URL: ${COOLIFY_BASE_URL}`);
console.log(`Domain: ${MCPAAS_DOMAIN}`);
console.log(`Repository: ${GITHUB_REPO}`);
console.log('');

// Deployment steps
const deploymentSteps = [
  {
    name: 'List Available Servers',
    tool: 'list_servers',
    args: {},
    required: true
  },
  {
    name: 'Create MCPaaS Project',
    tool: 'create_mcpaas_project',
    args: {
      name: 'mcpaas-platform',
      description: 'MCPaaS - Model Context Protocol Platform as a Service',
      domain: MCPAAS_DOMAIN,
      server_uuid: 'SERVER_UUID_PLACEHOLDER' // Will be replaced with actual server UUID
    },
    required: true
  },
  {
    name: 'Deploy MCPaaS Infrastructure Stack',
    tool: 'deploy_mcpaas_stack',
    args: {
      project_uuid: 'PROJECT_UUID_PLACEHOLDER', // Will be replaced
      server_uuid: 'SERVER_UUID_PLACEHOLDER',   // Will be replaced
      include_postgres: true,
      include_redis: true,
      include_minio: true,
      domain: MCPAAS_DOMAIN,
      environment_variables: {
        NODE_ENV: 'production',
        NEXTAUTH_URL: `https://${MCPAAS_DOMAIN}`,
        COOLIFY_FQDN: MCPAAS_DOMAIN
      }
    },
    required: true
  },
  {
    name: 'Create MCPaaS Frontend Application',
    tool: 'create_application',
    args: {
      name: 'mcpaas-frontend',
      description: 'MCPaaS Frontend Application',
      project_uuid: 'PROJECT_UUID_PLACEHOLDER',
      server_uuid: 'SERVER_UUID_PLACEHOLDER',
      git_repository: GITHUB_REPO,
      git_branch: 'main',
      build_pack: 'dockerfile',
      dockerfile_location: 'Dockerfile',
      fqdn: `https://${MCPAAS_DOMAIN}:3000`
    },
    required: true
  }
];

async function callMCPTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/index.js'], {
      env: {
        ...process.env,
        COOLIFY_BASE_URL,
        COOLIFY_ACCESS_TOKEN
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the MCP response
          const lines = output.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine);
          
          if (response.result && response.result.content) {
            const content = response.result.content[0].text;
            const data = JSON.parse(content);
            resolve({ success: true, data });
          } else {
            resolve({ success: false, error: 'Invalid MCP response format' });
          }
        } catch (parseError) {
          resolve({ success: false, error: `Failed to parse response: ${parseError.message}` });
        }
      } else {
        resolve({ success: false, error: errorOutput || `Process exited with code ${code}` });
      }
    });

    child.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    // Send the MCP request
    const mcpRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    child.stdin.write(JSON.stringify(mcpRequest) + '\n');
    child.stdin.end();

    // Timeout after 30 seconds
    setTimeout(() => {
      child.kill();
      resolve({ success: false, error: 'Timeout' });
    }, 30000);
  });
}

async function deployMCPaaS() {
  console.log('🔍 Starting MCPaaS deployment process...\n');

  let serverUuid = null;
  let projectUuid = null;

  for (let i = 0; i < deploymentSteps.length; i++) {
    const step = deploymentSteps[i];
    console.log(`📋 Step ${i + 1}/${deploymentSteps.length}: ${step.name}`);

    // Replace placeholders with actual UUIDs
    let args = { ...step.args };
    if (serverUuid) {
      args = JSON.parse(JSON.stringify(args).replace(/SERVER_UUID_PLACEHOLDER/g, serverUuid));
    }
    if (projectUuid) {
      args = JSON.parse(JSON.stringify(args).replace(/PROJECT_UUID_PLACEHOLDER/g, projectUuid));
    }

    try {
      const result = await callMCPTool(step.tool, args);

      if (result.success) {
        console.log(`✅ ${step.name}: Success`);

        // Extract important UUIDs for next steps
        if (step.tool === 'list_servers' && result.data && result.data.length > 0) {
          serverUuid = result.data[0].uuid;
          console.log(`   📝 Using server: ${result.data[0].name} (${serverUuid})`);
        }

        if (step.tool === 'create_mcpaas_project' && result.data && result.data.project_uuid) {
          projectUuid = result.data.project_uuid;
          console.log(`   📝 Created project: ${projectUuid}`);
        }

        if (step.tool === 'deploy_mcpaas_stack' && result.data) {
          console.log(`   📝 Deployed services: ${result.data.services?.join(', ') || 'N/A'}`);
          console.log(`   📝 Status: ${result.data.status}`);
        }

        if (step.tool === 'create_application' && result.data && result.data.uuid) {
          console.log(`   📝 Created application: ${result.data.uuid}`);
        }

      } else {
        console.log(`❌ ${step.name}: Failed`);
        console.log(`   Error: ${result.error}`);

        if (step.required) {
          console.log('\n💥 Deployment failed at required step. Stopping.');
          return false;
        }
      }
    } catch (error) {
      console.log(`❌ ${step.name}: Exception - ${error.message}`);
      if (step.required) {
        console.log('\n💥 Deployment failed at required step. Stopping.');
        return false;
      }
    }

    console.log(''); // Empty line for readability
  }

  return true;
}

async function main() {
  const success = await deployMCPaaS();

  console.log('📊 Deployment Summary');
  console.log('====================');

  if (success) {
    console.log('🎉 MCPaaS deployment completed successfully!');
    console.log('');
    console.log('🌐 Access your MCPaaS instance at:');
    console.log(`   Main Application: https://${MCPAAS_DOMAIN}`);
    console.log(`   MinIO Console: https://minio.${MCPAAS_DOMAIN}`);
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('   1. Configure your DNS records to point to your Coolify server');
    console.log('   2. Set up SSL certificates in Coolify dashboard');
    console.log('   3. Configure GitHub OAuth application');
    console.log('   4. Set up environment variables for the frontend application');
    console.log('   5. Test MCP server deployment functionality');
  } else {
    console.log('❌ MCPaaS deployment failed.');
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check your Coolify access token');
    console.log('   2. Verify Coolify server is accessible');
    console.log('   3. Ensure you have sufficient permissions');
    console.log('   4. Check Coolify logs for detailed error messages');
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('MCPaaS Deployment Script');
  console.log('========================');
  console.log('');
  console.log('Environment Variables:');
  console.log('  COOLIFY_ACCESS_TOKEN  - Your Coolify API access token (required)');
  console.log('  COOLIFY_BASE_URL      - Coolify server URL (default: http://localhost:3000)');
  console.log('  MCPAAS_DOMAIN         - Domain for MCPaaS (default: mcpaas.example.com)');
  console.log('  GITHUB_REPO           - MCPaaS repository URL');
  console.log('');
  console.log('Usage:');
  console.log('  node deploy-mcpaas.js');
  console.log('  COOLIFY_ACCESS_TOKEN=your-token node deploy-mcpaas.js');
  process.exit(0);
}

main().catch(console.error);