# 🚀 Enhanced Coolify MCP Server

An enhanced Model Context Protocol (MCP) server implementation for [Coolify](https://coolify.io/) with **MCPaaS deployment capabilities**. This server enables AI assistants to deploy and manage complete **Model Context Protocol Platform as a Service** infrastructure through natural language.

## ✨ What's New in This Enhanced Version

This is a significantly enhanced version of the [original Coolify MCP Server](https://github.com/StuMason/coolify-mcp) with powerful new features for **automated MCPaaS deployment**:

### 🎯 **MCPaaS-Specific Features**
- **One-click MCPaaS project creation** with `create_mcpaas_project`
- **Automated infrastructure deployment** with `deploy_mcpaas_stack`
- **Complete application lifecycle management**
- **Automated deployment scripts** for zero-configuration setup

### 🛠️ **Enhanced Application Management**
- Create, list, get, delete applications with full configuration
- Monitor application resource usage and performance
- Real-time log streaming and analysis
- Environment variable bulk management
- Docker Compose service deployment

### 📊 **Advanced Deployment Management**
- List, monitor, and cancel deployments in real-time
- Deployment status tracking and notifications
- Automated rollback and recovery capabilities

## 🎬 Quick Start - Deploy MCPaaS in Minutes

```bash
# 1. Clone and setup
git clone https://github.com/dazeb/coolify-mcp-enhanced.git
cd coolify-mcp-enhanced
npm install && npm run build

# 2. Configure your environment
export COOLIFY_ACCESS_TOKEN="your-coolify-api-token"
export COOLIFY_BASE_URL="https://your-coolify-instance.com"
export MCPAAS_DOMAIN="mcpaas.yourdomain.com"

# 3. Deploy MCPaaS automatically
node deploy-mcpaas.js
```

**That's it!** Your complete MCPaaS platform will be deployed with:
- ✅ PostgreSQL database
- ✅ Redis cache  
- ✅ MinIO object storage
- ✅ MCPaaS frontend application
- ✅ All networking and SSL configured

## 🔧 Installation & Setup

### Prerequisites
- Node.js >= 18
- A running Coolify instance
- Coolify API access token

### Method 1: NPM Package (Coming Soon)
```bash
npm install -g @dazeb/coolify-mcp-enhanced
```

### Method 2: From Source
```bash
git clone https://github.com/dazeb/coolify-mcp-enhanced.git
cd coolify-mcp-enhanced
npm install
npm run build
```

### Method 3: Using uvx (Recommended)
```bash
uvx @dazeb/coolify-mcp-enhanced
```

## 🎯 New Tools & Capabilities

### MCPaaS Deployment Tools
| Tool | Description | Usage |
|------|-------------|-------|
| `create_mcpaas_project` | Create complete MCPaaS project | One-click project setup |
| `deploy_mcpaas_stack` | Deploy infrastructure services | PostgreSQL + Redis + MinIO |

### Application Management
| Tool | Description | Usage |
|------|-------------|-------|
| `list_applications` | List all applications | Get overview of deployments |
| `create_application` | Create new application | Deploy from Git repository |
| `get_application_resources` | Monitor resource usage | Performance monitoring |
| `get_application_logs` | Stream application logs | Real-time debugging |

### Environment & Configuration
| Tool | Description | Usage |
|------|-------------|-------|
| `get_application_environment_variables` | Get env vars | Configuration management |
| `update_application_environment_variables` | Update env vars | Bulk configuration updates |
| `create_docker_compose_service` | Deploy Docker Compose | Custom service deployment |

### Deployment Management
| Tool | Description | Usage |
|------|-------------|-------|
| `get_deployments` | List deployments | Track deployment history |
| `cancel_deployment` | Cancel running deployment | Stop failed deployments |
| `get_deployment` | Get deployment details | Monitor deployment status |

## 🤖 AI Assistant Integration

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

### Example AI Prompts

```
# Deploy complete MCPaaS platform
"Create a new MCPaaS project called 'my-platform' and deploy the full stack including PostgreSQL, Redis, and MinIO services on my Coolify server."

# Monitor applications
"Show me all applications and their resource usage. If any application is using more than 80% CPU, show me its logs."

# Manage deployments
"List all deployments for my MCPaaS frontend application and cancel any that are stuck or failed."

# Environment management
"Update the environment variables for my MCPaaS application to include the GitHub OAuth credentials and restart the application."
```

## 📚 Comprehensive Documentation

- **[MCPaaS Deployment Guide](README-MCPAAS.md)** - Complete deployment documentation
- **[API Reference](docs/api-reference.md)** - All available tools and parameters
- **[Examples](examples/)** - Real-world usage examples
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

## 🧪 Testing & Validation

### Test the Enhanced Server
```bash
# Test basic functionality
node test-mcpaas.js

# Test MCPaaS deployment (dry run)
MCPAAS_DOMAIN=test.example.com node deploy-mcpaas.js --dry-run

# Run full test suite
npm test
```

### Validate Your Deployment
```bash
# Check all services are running
curl https://your-mcpaas-domain.com/api/health

# Test MCP server functionality
curl https://your-mcpaas-domain.com/api/mcp/health
```

## 🌟 What Makes This Enhanced?

| Feature | Original Server | Enhanced Server |
|---------|----------------|-----------------|
| **Basic Operations** | ✅ Servers, Projects, Services | ✅ All original features |
| **Application Management** | ❌ Limited | ✅ Complete lifecycle |
| **MCPaaS Deployment** | ❌ Manual setup | ✅ One-click automation |
| **Environment Variables** | ❌ Not supported | ✅ Bulk management |
| **Deployment Monitoring** | ❌ Basic status | ✅ Real-time tracking |
| **Docker Compose** | ❌ Not supported | ✅ Full support |
| **Automated Scripts** | ❌ None | ✅ Complete automation |
| **Resource Monitoring** | ❌ Limited | ✅ Comprehensive metrics |

## 🚀 Real-World Use Cases

### 1. **Instant MCPaaS Deployment**
Deploy a complete Model Context Protocol platform in under 5 minutes with full infrastructure, monitoring, and SSL.

### 2. **AI-Powered DevOps**
Use AI assistants to manage your entire Coolify infrastructure through natural language commands.

### 3. **Automated CI/CD**
Integrate with your CI/CD pipelines for automated application deployment and management.

### 4. **Multi-Environment Management**
Manage development, staging, and production environments with consistent automation.

## 🤝 Contributing

We welcome contributions! This enhanced server builds upon the excellent foundation of the original Coolify MCP Server.

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - Enhanced version maintains the same license as the original.

## 🙏 Acknowledgments

- **[Stuart Mason](https://github.com/StuMason)** - Original Coolify MCP Server
- **[Coolify](https://coolify.io/)** - Amazing self-hosting platform
- **[Model Context Protocol](https://modelcontextprotocol.io/)** - Revolutionary AI integration standard

## 🔗 Links

- **[Original Coolify MCP Server](https://github.com/StuMason/coolify-mcp)**
- **[MCPaaS Platform](https://github.com/dazeb/mcpaas-v3)**
- **[Coolify Documentation](https://coolify.io/docs)**
- **[MCP Specification](https://spec.modelcontextprotocol.io/)**

---

**Ready to revolutionize your deployment workflow?** 
🚀 **[Get started with MCPaaS deployment now!](README-MCPAAS.md)**