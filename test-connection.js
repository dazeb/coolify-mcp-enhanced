#!/usr/bin/env node

import { CoolifyClient } from './dist/lib/coolify-client.js';

async function testConnection() {
  const config = {
    baseUrl: process.env.COOLIFY_BASE_URL || 'https://s1.v0cl.one',
    accessToken: process.env.COOLIFY_ACCESS_TOKEN || '19|LlTDtAITWr02vYNa6T5S3tG5RNSkFeCoIMVmn5xDbc6f52af'
  };

  console.log('Testing connection to:', config.baseUrl);
  console.log('Using token:', config.accessToken.substring(0, 10) + '...');

  try {
    const client = new CoolifyClient(config);
    
    console.log('\n1. Testing basic connection...');
    await client.validateConnection();
    console.log('✅ Connection successful!');

    console.log('\n2. Testing list servers...');
    const servers = await client.listServers();
    console.log('✅ Servers retrieved:', servers.length);
    console.log('Server details:', JSON.stringify(servers, null, 2));

    console.log('\n3. Testing list projects...');
    const projects = await client.listProjects();
    console.log('✅ Projects retrieved:', projects.length);
    console.log('Project details:', JSON.stringify(projects, null, 2));

    console.log('\n4. Testing list applications...');
    const applications = await client.listApplications();
    console.log('✅ Applications retrieved:', applications.length);
    console.log('Application details:', JSON.stringify(applications, null, 2));

    console.log('\n5. Testing list databases...');
    const databases = await client.listDatabases();
    console.log('✅ Databases retrieved:', databases.length);
    console.log('Database details:', JSON.stringify(databases, null, 2));

    console.log('\n6. Testing list services...');
    const services = await client.listServices();
    console.log('✅ Services retrieved:', services.length);
    console.log('Service details:', JSON.stringify(services, null, 2));

    if (servers.length > 0) {
      const serverUuid = servers[0].uuid;
      console.log(`\n7. Testing server resources for server: ${serverUuid}...`);
      try {
        const resources = await client.getServerResources(serverUuid);
        console.log('✅ Server resources retrieved:', JSON.stringify(resources, null, 2));
      } catch (error) {
        console.log('⚠️ Server resources error:', error.message);
      }

      console.log(`\n8. Testing server domains for server: ${serverUuid}...`);
      try {
        const domains = await client.getServerDomains(serverUuid);
        console.log('✅ Server domains retrieved:', JSON.stringify(domains, null, 2));
      } catch (error) {
        console.log('⚠️ Server domains error:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();