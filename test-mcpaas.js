#!/usr/bin/env node

// Test script for the enhanced Coolify MCP server
// This script demonstrates the new MCPaaS deployment capabilities

const { spawn } = require('child_process');
const readline = require('readline');

// Configuration
const COOLIFY_BASE_URL = process.env.COOLIFY_BASE_URL || 'http://localhost:3000';
const COOLIFY_ACCESS_TOKEN = process.env.COOLIFY_ACCESS_TOKEN || '';

if (!COOLIFY_ACCESS_TOKEN) {
  console.error('❌ COOLIFY_ACCESS_TOKEN environment variable is required');
  process.exit(1);
}

console.log('🚀 Testing Enhanced Coolify MCP Server for MCPaaS');
console.log('================================================');
console.log(`Base URL: ${COOLIFY_BASE_URL}`);
console.log('');

// Test scenarios
const testScenarios = [
  {
    name: 'List Servers',
    tool: 'list_servers',
    args: {}
  },
  {
    name: 'List Projects',
    tool: 'list_projects', 
    args: {}
  },
  {
    name: 'List Services',
    tool: 'list_services',
    args: {}
  },
  {
    name: 'List Applications',
    tool: 'list_applications',
    args: {}
  }
];

async function runTest(scenario) {
  return new Promise((resolve, reject) => {
    console.log(`🧪 Testing: ${scenario.name}`);
    
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
        console.log(`✅ ${scenario.name}: Success`);
        resolve({ success: true, output, error: null });
      } else {
        console.log(`❌ ${scenario.name}: Failed (exit code ${code})`);
        if (errorOutput) {
          console.log(`   Error: ${errorOutput.trim()}`);
        }
        resolve({ success: false, output, error: errorOutput });
      }
    });

    child.on('error', (error) => {
      console.log(`❌ ${scenario.name}: Error starting process`);
      console.log(`   Error: ${error.message}`);
      resolve({ success: false, output: '', error: error.message });
    });

    // Send the MCP request
    const mcpRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: scenario.tool,
        arguments: scenario.args
      }
    };

    child.stdin.write(JSON.stringify(mcpRequest) + '\n');
    child.stdin.end();

    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill();
      resolve({ success: false, output, error: 'Timeout' });
    }, 10000);
  });
}

async function main() {
  console.log('🔧 Testing basic connectivity...');
  
  let successCount = 0;
  let totalTests = testScenarios.length;

  for (const scenario of testScenarios) {
    try {
      const result = await runTest(scenario);
      if (result.success) {
        successCount++;
      }
    } catch (error) {
      console.log(`❌ ${scenario.name}: Exception - ${error.message}`);
    }
    console.log(''); // Empty line for readability
  }

  console.log('📊 Test Results Summary');
  console.log('======================');
  console.log(`✅ Successful tests: ${successCount}/${totalTests}`);
  console.log(`❌ Failed tests: ${totalTests - successCount}/${totalTests}`);
  
  if (successCount === totalTests) {
    console.log('🎉 All tests passed! Enhanced Coolify MCP server is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check your Coolify configuration and access token.');
  }

  console.log('');
  console.log('🚀 MCPaaS Deployment Tools Available:');
  console.log('   - create_mcpaas_project: Create a complete MCPaaS project');
  console.log('   - deploy_mcpaas_stack: Deploy PostgreSQL, Redis, and MinIO services');
  console.log('   - create_application: Create and deploy the MCPaaS frontend');
  console.log('   - create_docker_compose_service: Deploy custom Docker Compose services');
  console.log('   - And many more application and service management tools!');
}

main().catch(console.error);