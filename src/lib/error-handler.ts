import debug from 'debug';

const log = debug('coolify:error-handler');

export interface EnhancedError {
  code: string;
  message: string;
  details?: Record<string, any>;
  suggestions?: string[];
  retryable: boolean;
  originalError?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class ErrorHandler {
  /**
   * Parse API error responses into structured format
   */
  static parseApiError(error: any): EnhancedError {
    log('Parsing API error: %o', error);

    // Handle fetch/network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to Coolify server',
        details: { originalMessage: error.message },
        suggestions: [
          'Check if the Coolify server is running',
          'Verify the server URL is correct',
          'Check network connectivity'
        ],
        retryable: true,
        originalError: error
      };
    }

    // Handle HTTP errors with JSON responses
    if (error.message && typeof error.message === 'string') {
      // Parse common Coolify API error patterns
      if (error.message.includes('Not found')) {
        return {
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found',
          details: { originalMessage: error.message },
          suggestions: [
            'Verify the resource UUID is correct',
            'Check if the resource exists in Coolify',
            'Ensure you have permission to access this resource'
          ],
          retryable: false,
          originalError: error
        };
      }

      if (error.message.includes('You need to provide')) {
        return {
          code: 'MISSING_REQUIRED_PARAMETER',
          message: error.message,
          details: { originalMessage: error.message },
          suggestions: [
            'Check the API documentation for required parameters',
            'Use auto-configuration options if available',
            'Verify all required fields are provided'
          ],
          retryable: false,
          originalError: error
        };
      }

      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication failed - invalid or expired API token',
          details: { originalMessage: error.message },
          suggestions: [
            'Check if your API token is valid',
            'Verify the token has not expired',
            'Ensure the token has the required permissions'
          ],
          retryable: false,
          originalError: error
        };
      }

      if (error.message.includes('Rate limit') || error.message.includes('429')) {
        return {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'API rate limit exceeded',
          details: { originalMessage: error.message },
          suggestions: [
            'Wait before making additional requests',
            'Implement request throttling',
            'Consider upgrading your API plan'
          ],
          retryable: true,
          originalError: error
        };
      }

      if (error.message.includes('Server error') || error.message.includes('500')) {
        return {
          code: 'SERVER_ERROR',
          message: 'Coolify server encountered an internal error',
          details: { originalMessage: error.message },
          suggestions: [
            'Try the request again in a few moments',
            'Check Coolify server status',
            'Contact support if the issue persists'
          ],
          retryable: true,
          originalError: error
        };
      }
    }

    // Handle validation errors from MCP
    if (error.code === -32602 && error.message?.includes('Invalid arguments')) {
      return {
        code: 'PARAMETER_VALIDATION_ERROR',
        message: 'Invalid parameters provided to MCP tool',
        details: { 
          originalMessage: error.message,
          mcpError: error
        },
        suggestions: [
          'Check parameter types and values',
          'Refer to tool documentation for valid parameters',
          'Use parameter validation before calling tools'
        ],
        retryable: false,
        originalError: error
      };
    }

    // Generic error fallback
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: { 
        originalMessage: error.message,
        errorType: typeof error,
        errorConstructor: error.constructor?.name
      },
      suggestions: [
        'Check the error details for more information',
        'Try the operation again',
        'Contact support if the issue persists'
      ],
      retryable: false,
      originalError: error
    };
  }

  /**
   * Format error message for user display
   */
  static formatUserMessage(error: EnhancedError): string {
    let message = `❌ ${error.message}`;
    
    if (error.code !== 'UNKNOWN_ERROR') {
      message += ` (${error.code})`;
    }

    if (error.suggestions && error.suggestions.length > 0) {
      message += '\n\n💡 Suggestions:';
      error.suggestions.forEach((suggestion, index) => {
        message += `\n   ${index + 1}. ${suggestion}`;
      });
    }

    if (error.details && Object.keys(error.details).length > 0) {
      message += '\n\n🔍 Details:';
      Object.entries(error.details).forEach(([key, value]) => {
        if (key !== 'originalMessage' && value !== undefined) {
          message += `\n   ${key}: ${JSON.stringify(value)}`;
        }
      });
    }

    return message;
  }

  /**
   * Determine if an error should be retried
   */
  static shouldRetry(error: EnhancedError): boolean {
    return error.retryable;
  }

  /**
   * Create a validation error
   */
  static createValidationError(
    message: string, 
    details?: Record<string, any>
  ): EnhancedError {
    return {
      code: 'VALIDATION_ERROR',
      message,
      details,
      suggestions: [
        'Check the parameter documentation',
        'Verify all required parameters are provided',
        'Ensure parameter types are correct'
      ],
      retryable: false
    };
  }

  /**
   * Create a configuration error
   */
  static createConfigurationError(
    message: string,
    suggestions: string[] = []
  ): EnhancedError {
    return {
      code: 'CONFIGURATION_ERROR',
      message,
      suggestions: [
        ...suggestions,
        'Check your Coolify server configuration',
        'Verify environment and project settings'
      ],
      retryable: false
    };
  }

  /**
   * Validate operation result and provide structured response
   */
  static validateResult<T>(
    result: T,
    operation: string,
    expectedFields?: string[]
  ): { success: true; data: T } | { success: false; error: EnhancedError } {
    if (!result) {
      return {
        success: false,
        error: this.createValidationError(
          `${operation} returned no data`,
          { operation, result }
        )
      };
    }

    if (expectedFields && typeof result === 'object') {
      const missing = expectedFields.filter(field => 
        !(field in (result as any))
      );
      
      if (missing.length > 0) {
        return {
          success: false,
          error: this.createValidationError(
            `${operation} response missing required fields: ${missing.join(', ')}`,
            { operation, missingFields: missing, result }
          )
        };
      }
    }

    return { success: true, data: result };
  }
}