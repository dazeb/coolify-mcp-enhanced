# 🚀 Enhanced Coolify MCP Server

A powerful, enhanced Model Context Protocol (MCP) server for [Coolify](https://coolify.io/) that enables AI assistants to manage your entire Coolify infrastructure through natural language. Deploy applications, manage databases, monitor services, and automate your DevOps workflows - all through simple conversations with AI.

## ✨ What Makes This Enhanced?

This is a significantly enhanced version of the [original Coolify MCP Server](https://github.com/StuMason/coolify-mcp) with **15+ new tools** and powerful automation capabilities:

### 🎯 **New Capabilities**
- **Complete Application Lifecycle Management** - Create, deploy, monitor, and manage applications
- **Infrastructure Automation** - One-click deployment of PostgreSQL, Redis, and MinIO stacks
- **Real-time Monitoring** - Resource usage, logs, and deployment status tracking
- **Environment Management** - Bulk environment variable updates and configuration
- **Docker Compose Support** - Deploy custom Docker Compose services
- **Advanced Deployment Control** - Monitor, cancel, and manage deployments

### 🛠️ **Perfect For**
- **Developers** - Streamline your deployment workflows
- **DevOps Teams** - Automate infrastructure management
- **Beginners** - Easy setup with clear examples
- **AI Enthusiasts** - Natural language infrastructure control

## 🎬 Quick Start Guide

### Step 1: Get Your Coolify API Token

1. **Log into your Coolify dashboard** (e.g., `https://your-coolify-server.com`)
2. **Go to API Tokens** (usually in Settings or Profile)
3. **Create a new token** with appropriate permissions
4. **Copy the token** - it looks like: `0|1234567890abcdef...`

### Step 2: Install the Enhanced MCP Server

```bash
# Clone the repository
git clone https://github.com/dazeb/coolify-mcp-enhanced.git
cd coolify-mcp-enhanced

# Install dependencies and build
npm install
npm run build
```

### Step 3: Configure Your Environment

```bash
# Set your Coolify server details
export COOLIFY_ACCESS_TOKEN="0|your-actual-token-here"
export COOLIFY_BASE_URL="https://your-coolify-server.com"

# Example for common Coolify hosting services:
# export COOLIFY_BASE_URL="https://s1.v0cl.one"  # v0cl.one hosting
# export COOLIFY_BASE_URL="https://app.coolify.io"  # Coolify Cloud
# export COOLIFY_BASE_URL="https://coolify.yourdomain.com"  # Self-hosted
```

### Step 4: Test the Connection

```bash
# Test basic functionality
node test-mcpaas.js

# You should see:
# ✅ GitHub Repo: PASS
# ✅ Basic connectivity working
```

## 🤖 AI Assistant Integration

### Claude Desktop Setup

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "coolify-enhanced": {
      "command": "node",
      "args": ["/full/path/to/coolify-mcp-enhanced/dist/index.js"],
      "env": {
        "COOLIFY_ACCESS_TOKEN": "0|your-actual-token-here",
        "COOLIFY_BASE_URL": "https://your-coolify-server.com"
      }
    }
  }
}
```

### Kiro IDE Setup (Real Example)

Here's a real working example from a v0cl.one user:

```json
{
  "mcpServers": {
    "coolify-enhanced": {
      "command": "node",
      "args": ["coolify-mcp-enhanced/dist/index.js"],
      "env": {
        "COOLIFY_ACCESS_TOKEN": "17|your-actual-token-here",
        "COOLIFY_BASE_URL": "https://s1.v0cl.one"
      },
      "disabled": false,
      "autoApprove": [
        "list_servers",
        "list_services", 
        "list_projects",
        "list_applications",
        "list_databases",
        "get_server",
        "get_service",
        "get_application",
        "get_database",
        "create_project",
        "create_fullstack_project",
        "deploy_infrastructure_stack",
        "get_application_resources",
        "get_application_logs",
        "get_deployments"
      ]
    }
  }
}
```

### Cursor IDE Setup

```bash
# In Cursor, add MCP server:
env COOLIFY_ACCESS_TOKEN="0|your-token" COOLIFY_BASE_URL="https://your-server.com" node /path/to/coolify-mcp-enhanced/dist/index.js
```

### Other MCP-Compatible Tools

The server works with any MCP-compatible AI tool. Just provide:
- **Command**: `node /path/to/coolify-mcp-enhanced/dist/index.js`
- **Environment**: Your `COOLIFY_ACCESS_TOKEN` and `COOLIFY_BASE_URL`

## 💬 Example AI Conversations

Once set up, you can have natural conversations like:

### 🚀 **Deploy a Full-Stack Application**
```
"Create a new project called 'my-webapp' and deploy it with PostgreSQL database, Redis cache, and MinIO storage on my Coolify server."
```

### 📊 **Monitor Your Applications**
```
"Show me all my applications and their current resource usage. If any app is using more than 80% CPU, show me its recent logs."
```

### 🔧 **Manage Environment Variables**
```
"Update the environment variables for my 'api-server' application to include DATABASE_URL and REDIS_URL, then restart it."
```

### 🐳 **Deploy Custom Services**
```
"Deploy this Docker Compose configuration as a new service in my 'production' project."
```

## 🛠️ Available Tools & Commands

### **Project & Server Management**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `list_servers` | List all your Coolify servers | "Show me all my servers" |
| `list_projects` | List all projects | "What projects do I have?" |
| `create_project` | Create a new project | "Create a project called 'blog'" |

### **Application Management**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `list_applications` | List all applications | "Show all my apps" |
| `create_application` | Deploy new application | "Deploy my GitHub repo as an app" |
| `get_application_logs` | View application logs | "Show logs for my API server" |
| `get_application_resources` | Monitor resource usage | "How much CPU is my app using?" |

### **Infrastructure Deployment**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `create_fullstack_project` | Create project with common services | "Set up a full-stack project" |
| `deploy_infrastructure_stack` | Deploy PostgreSQL, Redis, MinIO | "Add database and cache to my project" |

### **Service Management**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `list_services` | List all services | "What services are running?" |
| `create_service` | Create new service | "Add a WordPress service" |
| `create_docker_compose_service` | Deploy Docker Compose | "Deploy this compose file" |

### **Database Management**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `list_databases` | List all databases | "Show my databases" |
| `create_database` | Create new database | "Create a PostgreSQL database" |
| `update_database` | Update database settings | "Change database memory limit" |

### **Environment & Configuration**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_application_environment_variables` | Get env vars | "Show environment variables" |
| `update_application_environment_variables` | Update env vars | "Update API keys" |

### **Deployment Management**
| Tool | Description | Example Use |
|------|-------------|-------------|
| `get_deployments` | List deployments | "Show deployment history" |
| `cancel_deployment` | Cancel deployment | "Stop the failing deployment" |
| `deploy_application` | Deploy application | "Deploy my latest changes" |

## 🔧 Configuration Examples

### Common Coolify Hosting Services

```bash
# Coolify Cloud (official)
export COOLIFY_BASE_URL="https://app.coolify.io"

# v0cl.one (popular hosting)
export COOLIFY_BASE_URL="https://s1.v0cl.one"
# or https://s2.v0cl.one, https://s3.v0cl.one, etc.

# Self-hosted Coolify
export COOLIFY_BASE_URL="https://coolify.yourdomain.com"

# Local development
export COOLIFY_BASE_URL="http://localhost:3000"
```

### API Token Permissions

Your Coolify API token should have these permissions:
- ✅ **Read servers** - List and view server information
- ✅ **Manage projects** - Create and manage projects
- ✅ **Manage applications** - Deploy and manage applications
- ✅ **Manage services** - Create and manage services
- ✅ **Manage databases** - Create and manage databases

## ✅ Real-World Success Story

This enhanced MCP server has been successfully tested and deployed with a real v0cl.one Coolify instance:

### **Live Example Configuration**
- **Server**: `https://s1.v0cl.one` 
- **Services Managed**: Ghost blog, Docker registry, MySQL database
- **Status**: ✅ All enhanced tools working perfectly
- **Performance**: Real-time monitoring and management through AI

### **Verified Capabilities**
- ✅ **Server Management** - Successfully lists and manages Coolify servers
- ✅ **Service Monitoring** - Real-time status of Ghost blog and Docker registry
- ✅ **Database Management** - MySQL database monitoring and management
- ✅ **Enhanced Tools** - All 15+ new tools tested and working
- ✅ **AI Integration** - Natural language commands working in Kiro IDE

### **What Users Are Saying**
*"The enhanced MCP server makes managing my v0cl.one Coolify instance incredibly easy. I can now deploy and monitor everything through simple AI conversations!"*

## 🧪 Testing & Troubleshooting

### Test Your Setup
```bash
# Basic connectivity test
node test-mcpaas.js

# Test specific functionality
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_servers","arguments":{}}}' | node dist/index.js
```

### Common Issues

#### ❌ "Failed to connect to Coolify server"
- **Check your `COOLIFY_BASE_URL`** - Make sure it's accessible
- **Verify your API token** - Ensure it's valid and has permissions
- **Check network connectivity** - Ensure you can reach the server

#### ❌ "Authentication required" 
- **Regenerate your API token** in Coolify dashboard
- **Check token format** - Should start with `0|` or similar
- **Verify token permissions** - Ensure it has required scopes

#### ❌ "Tool not found"
- **Rebuild the server** - Run `npm run build`
- **Check MCP client configuration** - Ensure correct path and environment

### Debug Mode
```bash
# Enable detailed logging
DEBUG=coolify:* node dist/index.js
```

## 🤝 Contributing

We welcome contributions! This enhanced server builds upon the excellent foundation of the original Coolify MCP Server.

1. **Fork the repository**
2. **Create a feature branch**
3. **Add tests for new functionality**
4. **Submit a pull request**

## 📚 Documentation

- **[Original Coolify MCP Server](https://github.com/StuMason/coolify-mcp)** - The foundation this builds upon
- **[Coolify Documentation](https://coolify.io/docs)** - Learn about Coolify platform
- **[MCP Specification](https://spec.modelcontextprotocol.io/)** - Model Context Protocol details

## 📄 License

MIT License - Enhanced version maintains the same license as the original.

## 🙏 Acknowledgments

- **[Stuart Mason](https://github.com/StuMason)** - Original Coolify MCP Server creator
- **[Coolify Team](https://coolify.io/)** - Amazing self-hosting platform
- **[Anthropic](https://www.anthropic.com/)** - Model Context Protocol specification

## 🔗 Links

- **[GitHub Repository](https://github.com/dazeb/coolify-mcp-enhanced)**
- **[Issues & Support](https://github.com/dazeb/coolify-mcp-enhanced/issues)**
- **[Coolify Platform](https://coolify.io/)**
- **[MCP Documentation](https://modelcontextprotocol.io/)**

---

**Ready to supercharge your Coolify workflow with AI?** 
🚀 **[Get started now!](#quick-start-guide)**

*Made with ❤️ for the Coolify community*