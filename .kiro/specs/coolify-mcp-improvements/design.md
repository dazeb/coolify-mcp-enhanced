# Design Document

## Overview

This design document outlines the architecture and implementation approach for improving the Coolify MCP server. The improvements focus on enhancing error handling, service creation workflows, parameter validation, and overall user experience while maintaining backward compatibility with existing functionality.

## Architecture

### Current Architecture Analysis

The existing MCP server follows a clean layered architecture:
- **MCP Server Layer** (`CoolifyMcpServer`): Handles MCP protocol and tool registration
- **Client Layer** (`CoolifyClient`): Manages HTTP communication with Coolify API
- **Type Layer** (`types/coolify.ts`): Defines TypeScript interfaces and types

### Enhanced Architecture Components

#### 1. Error Handling Layer
- **ErrorHandler Class**: Centralized error processing and formatting
- **RetryManager Class**: Handles retry logic for transient failures
- **ValidationError Class**: Structured validation error reporting

#### 2. Parameter Management Layer
- **ParameterValidator Class**: Pre-validates parameters before API calls
- **DefaultProvider Class**: Supplies default values and auto-detection
- **ConfigurationBuilder Class**: Builds complex configurations from simple inputs

#### 3. Service Management Layer
- **ServiceTypeRegistry Class**: Manages service type definitions and requirements
- **EnvironmentManager Class**: Handles environment auto-detection and creation
- **DependencyResolver Class**: Manages service dependencies and ordering

## Components and Interfaces

### 1. Enhanced Error Handling

```typescript
interface EnhancedError {
  code: string;
  message: string;
  details?: Record<string, any>;
  suggestions?: string[];
  retryable: boolean;
}

class ErrorHandler {
  static parseApiError(error: any): EnhancedError;
  static formatUserMessage(error: EnhancedError): string;
  static shouldRetry(error: EnhancedError): boolean;
}

class RetryManager {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions
  ): Promise<T>;
}
```

### 2. Parameter Validation and Defaults

```typescript
interface ParameterDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultProvider?: () => Promise<any>;
  validator?: (value: any) => boolean;
  description: string;
}

class ParameterValidator {
  validateParameters(
    toolName: string,
    parameters: Record<string, any>
  ): ValidationResult;
  
  async enrichWithDefaults(
    toolName: string,
    parameters: Record<string, any>
  ): Promise<Record<string, any>>;
}

class DefaultProvider {
  async getDefaultEnvironment(projectUuid: string): Promise<string>;
  async getDefaultDestination(serverUuid: string): Promise<string>;
  async detectBuildPack(repository: string): Promise<string>;
}
```

### 3. Service Type Management

```typescript
interface ServiceTypeDefinition {
  type: string;
  name: string;
  description: string;
  requiredParameters: string[];
  optionalParameters: string[];
  dependencies: string[];
  defaultConfiguration: Record<string, any>;
}

class ServiceTypeRegistry {
  getServiceTypes(): ServiceTypeDefinition[];
  getServiceType(type: string): ServiceTypeDefinition;
  validateServiceCreation(type: string, parameters: any): ValidationResult;
}

class EnvironmentManager {
  async ensureEnvironment(
    projectUuid: string,
    environmentName?: string
  ): Promise<Environment>;
  
  async getOrCreateDefaultEnvironment(
    projectUuid: string
  ): Promise<Environment>;
}
```

### 4. Enhanced MCP Tools

```typescript
class EnhancedCoolifyMcpServer extends CoolifyMcpServer {
  private errorHandler: ErrorHandler;
  private parameterValidator: ParameterValidator;
  private serviceTypeRegistry: ServiceTypeRegistry;
  private environmentManager: EnvironmentManager;
  
  protected async executeWithValidation<T>(
    toolName: string,
    parameters: any,
    operation: (validatedParams: any) => Promise<T>
  ): Promise<T>;
}
```

## Data Models

### Enhanced Service Creation Request

```typescript
interface EnhancedCreateServiceRequest {
  type: string;
  project_uuid: string;
  server_uuid: string;
  name?: string;
  description?: string;
  environment_name?: string;
  environment_uuid?: string;
  destination_uuid?: string;
  instant_deploy?: boolean;
  auto_configure?: boolean; // New: Auto-configure with defaults
  wait_for_deployment?: boolean; // New: Wait for deployment completion
}
```

### Enhanced Application Creation Request

```typescript
interface EnhancedCreateApplicationRequest {
  name: string;
  description?: string;
  project_uuid: string;
  server_uuid: string;
  git_repository?: string;
  git_branch?: string;
  build_pack?: string;
  dockerfile_location?: string;
  docker_compose_location?: string;
  fqdn?: string;
  environment_name?: string;
  auto_detect_build_pack?: boolean; // New: Auto-detect build pack
  auto_configure_environment?: boolean; // New: Auto-configure environment
  wait_for_initial_deployment?: boolean; // New: Wait for first deployment
}
```

### Infrastructure Stack Configuration

```typescript
interface EnhancedInfrastructureConfig {
  includePostgres: boolean;
  includeRedis: boolean;
  includeMinIO: boolean;
  domain?: string;
  environment_variables?: Record<string, string>;
  auto_create_environment?: boolean; // New: Auto-create environment
  service_naming_pattern?: string; // New: Custom naming pattern
  wait_for_services?: boolean; // New: Wait for all services to be ready
}
```

## Error Handling

### Error Categories

1. **Validation Errors**: Parameter validation failures
2. **API Errors**: Coolify API response errors
3. **Network Errors**: Connection and timeout issues
4. **Configuration Errors**: Missing or invalid configuration
5. **Dependency Errors**: Service dependency issues

### Error Response Format

```typescript
interface ToolErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    suggestions?: string[];
  };
  context?: {
    tool: string;
    parameters: Record<string, any>;
    timestamp: string;
  };
}
```

### Retry Strategy

- **Exponential Backoff**: 1s, 2s, 4s, 8s intervals
- **Max Retries**: 3 attempts for transient errors
- **Retryable Errors**: Network timeouts, 5xx responses, rate limits
- **Non-Retryable Errors**: 4xx client errors, validation failures

## Testing Strategy

### Unit Testing
- **Error Handler Tests**: Verify error parsing and formatting
- **Parameter Validator Tests**: Test validation logic and defaults
- **Service Type Registry Tests**: Validate service type definitions
- **Retry Manager Tests**: Test retry logic and backoff

### Integration Testing
- **API Integration Tests**: Test enhanced API interactions
- **End-to-End Workflow Tests**: Test complete service creation workflows
- **Error Scenario Tests**: Test error handling in various failure modes
- **Performance Tests**: Verify retry logic doesn't impact performance

### Test Data
- **Mock Coolify Responses**: Simulate various API responses
- **Error Scenarios**: Test different error conditions
- **Service Configurations**: Test various service type configurations
- **Parameter Combinations**: Test different parameter combinations

## Implementation Phases

### Phase 1: Core Infrastructure
1. Implement ErrorHandler and RetryManager classes
2. Create ParameterValidator with basic validation
3. Add enhanced error responses to existing tools
4. Implement basic retry logic for API calls

### Phase 2: Service Management
1. Create ServiceTypeRegistry with service definitions
2. Implement EnvironmentManager for auto-environment handling
3. Enhance create_service tool with auto-configuration
4. Add service dependency resolution

### Phase 3: Application Management
1. Enhance create_application with auto-detection
2. Implement build pack detection logic
3. Add application deployment waiting functionality
4. Improve deployment error handling

### Phase 4: Infrastructure Stack
1. Enhance infrastructure stack deployment
2. Add dependency ordering for service creation
3. Implement rollback capabilities
4. Add comprehensive status reporting

### Phase 5: Documentation and Polish
1. Update tool descriptions with parameter requirements
2. Add parameter examples and presets
3. Implement comprehensive logging
4. Performance optimization and cleanup

## Security Considerations

- **Parameter Sanitization**: Validate and sanitize all input parameters
- **API Key Protection**: Ensure API keys are not logged or exposed
- **Error Information**: Limit sensitive information in error messages
- **Retry Limits**: Prevent infinite retry loops and rate limit abuse

## Performance Considerations

- **Caching**: Cache service type definitions and environment information
- **Parallel Operations**: Execute independent operations in parallel
- **Connection Pooling**: Reuse HTTP connections where possible
- **Timeout Management**: Implement appropriate timeouts for all operations

## Backward Compatibility

- **Existing Tools**: All existing tools maintain their current interfaces
- **Parameter Compatibility**: New optional parameters don't break existing usage
- **Response Format**: Enhanced responses include all existing fields
- **Error Handling**: Improved error handling doesn't change success response formats