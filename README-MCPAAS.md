# Enhanced Coolify MCP Server for MCPaaS

This is an enhanced version of the [Coolify MCP Server](https://github.com/StuMason/coolify-mcp) with additional features specifically designed for deploying and managing MCPaaS (Model Context Protocol Platform as a Service).

## 🚀 New Features Added

### Application Management
- **`list_applications`** - List all Coolify applications
- **`get_application`** - Get details about a specific application
- **`create_application`** - Create new applications with full configuration
- **`delete_application`** - Delete applications with cleanup options
- **`get_application_resources`** - Monitor application resource usage
- **`get_application_logs`** - Retrieve application logs with filtering

### Environment Variable Management
- **`get_application_environment_variables`** - Get all environment variables for an application
- **`update_application_environment_variables`** - Bulk update environment variables

### Docker Compose Services
- **`create_docker_compose_service`** - Deploy custom Docker Compose services
- **`update_docker_compose_service`** - Update Docker Compose configurations

### Deployment Management
- **`get_deployments`** - List deployments for an application
- **`get_deployment`** - Get deployment details and status
- **`cancel_deployment`** - Cancel running deployments

### MCPaaS-Specific Tools
- **`create_mcpaas_project`** - Create a complete MCPaaS project structure
- **`deploy_mcpaas_stack`** - Deploy the full MCPaaS infrastructure (PostgreSQL, Redis, MinIO)

## 📦 Installation

### Prerequisites
- Node.js >= 18
- A running Coolify instance
- Coolify API access token

### Setup

1. **Clone this enhanced version:**
   ```bash
   git clone https://github.com/your-username/coolify-mcp-enhanced.git
   cd coolify-mcp-enhanced
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Set up environment variables:**
   ```bash
   export COOLIFY_ACCESS_TOKEN="your-coolify-api-token"
   export COOLIFY_BASE_URL="https://your-coolify-instance.com"
   ```

## 🎯 MCPaaS Deployment

### Quick Start

1. **Test the connection:**
   ```bash
   node test-mcpaas.js
   ```

2. **Deploy MCPaaS automatically:**
   ```bash
   MCPAAS_DOMAIN=mcpaas.yourdomain.com \
   GITHUB_REPO=https://github.com/your-username/mcpaas-v3.git \
   node deploy-mcpaas.js
   ```

### Manual Deployment Steps

#### 1. Create MCPaaS Project
```javascript
// Using the MCP tool
{
  "tool": "create_mcpaas_project",
  "args": {
    "name": "mcpaas-platform",
    "description": "MCPaaS Platform Deployment",
    "domain": "mcpaas.yourdomain.com",
    "server_uuid": "your-server-uuid"
  }
}
```

#### 2. Deploy Infrastructure Stack
```javascript
{
  "tool": "deploy_mcpaas_stack",
  "args": {
    "project_uuid": "your-project-uuid",
    "server_uuid": "your-server-uuid",
    "include_postgres": true,
    "include_redis": true,
    "include_minio": true,
    "domain": "mcpaas.yourdomain.com"
  }
}
```

#### 3. Create Frontend Application
```javascript
{
  "tool": "create_application",
  "args": {
    "name": "mcpaas-frontend",
    "project_uuid": "your-project-uuid",
    "server_uuid": "your-server-uuid",
    "git_repository": "https://github.com/your-username/mcpaas-v3.git",
    "git_branch": "main",
    "build_pack": "dockerfile",
    "fqdn": "https://mcpaas.yourdomain.com:3000"
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `COOLIFY_ACCESS_TOKEN` | Coolify API access token | Required |
| `COOLIFY_BASE_URL` | Coolify server URL | `http://localhost:3000` |
| `MCPAAS_DOMAIN` | Domain for MCPaaS deployment | `mcpaas.example.com` |
| `GITHUB_REPO` | MCPaaS repository URL | Required for deployment |

### MCPaaS Environment Variables

When deploying MCPaaS, these environment variables will be automatically configured:

```bash
# Core Configuration
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=auto-generated

# Database (auto-configured by Coolify)
DATABASE_URL=postgresql://user:pass@postgres:5432/mcpaas

# Redis (auto-configured by Coolify)
REDIS_URL=redis://:pass@redis:6379

# Storage (auto-configured by Coolify)
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=mcpaas
MINIO_SECRET_KEY=auto-generated

# Domain Configuration
COOLIFY_FQDN=your-domain.com
```

## 🛠️ Usage with AI Tools

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "coolify-enhanced": {
      "command": "node",
      "args": ["/path/to/coolify-mcp-enhanced/dist/index.js"],
      "env": {
        "COOLIFY_ACCESS_TOKEN": "your-token",
        "COOLIFY_BASE_URL": "https://your-coolify-instance.com"
      }
    }
  }
}
```

### Example Prompts

```
# Deploy complete MCPaaS platform
Create a new MCPaaS project called "my-mcpaas" and deploy the full stack including PostgreSQL, Redis, and MinIO services on server uuid-123.

# Manage applications
List all applications and show me the resource usage for the MCPaaS frontend application.

# Environment variables
Update the environment variables for application uuid-456 to include the GitHub OAuth credentials.

# Monitor deployments
Show me all deployments for the MCPaaS frontend and cancel any failed deployments.
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test MCPaaS Features
```bash
node test-mcpaas.js
```

### Manual Testing
```bash
# Test basic connectivity
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_servers","arguments":{}}}' | node dist/index.js

# Test MCPaaS project creation
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_mcpaas_project","arguments":{"name":"test-project","server_uuid":"your-uuid"}}}' | node dist/index.js
```

## 📚 API Reference

### New Tool Categories

#### Application Management
- `list_applications()` - List all applications
- `get_application(uuid)` - Get application details
- `create_application(config)` - Create new application
- `delete_application(uuid, options?)` - Delete application
- `get_application_resources(uuid)` - Get resource usage
- `get_application_logs(uuid, options?)` - Get application logs

#### Environment Variables
- `get_application_environment_variables(uuid)` - Get env vars
- `update_application_environment_variables(uuid, variables)` - Update env vars

#### Deployments
- `get_deployments(application_uuid)` - List deployments
- `get_deployment(uuid)` - Get deployment details
- `cancel_deployment(uuid)` - Cancel deployment

#### MCPaaS Specific
- `create_mcpaas_project(config)` - Create MCPaaS project
- `deploy_mcpaas_stack(project_uuid, server_uuid, config)` - Deploy infrastructure

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify your `COOLIFY_ACCESS_TOKEN` is correct
   - Check token permissions in Coolify dashboard

2. **Connection Issues**
   - Ensure `COOLIFY_BASE_URL` is accessible
   - Check firewall and network settings

3. **Deployment Failures**
   - Check Coolify server resources
   - Verify Docker is running on the target server
   - Review deployment logs in Coolify dashboard

### Debug Mode

Enable debug logging:
```bash
DEBUG=coolify:* node dist/index.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see the original [Coolify MCP Server](https://github.com/StuMason/coolify-mcp) for details.

## 🙏 Acknowledgments

- Original [Coolify MCP Server](https://github.com/StuMason/coolify-mcp) by Stuart Mason
- [Coolify](https://coolify.io/) for the amazing platform
- [Model Context Protocol](https://modelcontextprotocol.io/) specification

## 🚀 What's Next

This enhanced MCP server enables you to:

1. **Deploy MCPaaS with one command** - Complete infrastructure setup
2. **Manage applications programmatically** - Full lifecycle management
3. **Monitor and troubleshoot** - Real-time insights and logs
4. **Scale and optimize** - Resource management and performance tuning

Ready to deploy your MCPaaS platform? Run the deployment script and get started in minutes!