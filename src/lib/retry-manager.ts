import debug from 'debug';
import { ErrorHandler, EnhancedError } from './error-handler.js';

const log = debug('coolify:retry-manager');

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: EnhancedError) => boolean;
  onRetry?: (attempt: number, error: EnhancedError) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: EnhancedError;
  attempts: number;
  totalTime: number;
}

export class RetryManager {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 8000,  // 8 seconds
    backoffMultiplier: 2,
    retryCondition: (error: EnhancedError) => error.retryable,
    onRetry: () => {}
  };

  /**
   * Execute an operation with retry logic
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    let lastError: EnhancedError | null = null;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        log(`Attempt ${attempt}/${config.maxAttempts}`);
        const result = await operation();
        
        if (attempt > 1) {
          log(`Operation succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        const enhancedError = ErrorHandler.parseApiError(error);
        lastError = enhancedError;
        
        log(`Attempt ${attempt} failed: ${enhancedError.code} - ${enhancedError.message}`);

        // Don't retry if this is the last attempt
        if (attempt === config.maxAttempts) {
          break;
        }

        // Check if we should retry this error
        if (!config.retryCondition(enhancedError)) {
          log(`Error is not retryable: ${enhancedError.code}`);
          break;
        }

        // Calculate delay for next attempt
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        log(`Retrying in ${delay}ms...`);
        config.onRetry(attempt, enhancedError);

        // Wait before next attempt
        await this.delay(delay);
      }
    }

    // All attempts failed
    const totalTime = Date.now() - startTime;
    log(`All ${config.maxAttempts} attempts failed in ${totalTime}ms`);
    
    if (lastError) {
      throw lastError;
    } else {
      throw ErrorHandler.parseApiError(new Error('Operation failed after all retry attempts'));
    }
  }

  /**
   * Execute with retry and return detailed result
   */
  static async executeWithRetryResult<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let attempts = 0;

    try {
      const result = await this.executeWithRetry(
        async () => {
          attempts++;
          return await operation();
        },
        {
          ...options,
          onRetry: (attempt, error) => {
            options.onRetry?.(attempt, error);
          }
        }
      );

      return {
        success: true,
        data: result,
        attempts,
        totalTime: Date.now() - startTime
      };
    } catch (error) {
      const enhancedError = error instanceof Error 
        ? ErrorHandler.parseApiError(error)
        : error as EnhancedError;

      return {
        success: false,
        error: enhancedError,
        attempts,
        totalTime: Date.now() - startTime
      };
    }
  }

  /**
   * Create a retry-enabled version of an async function
   */
  static withRetry<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    options: RetryOptions = {}
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs): Promise<TReturn> => {
      return this.executeWithRetry(() => fn(...args), options);
    };
  }

  /**
   * Delay execution for specified milliseconds
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create retry options for different operation types
   */
  static createRetryOptions(operationType: 'api' | 'deployment' | 'validation'): RetryOptions {
    switch (operationType) {
      case 'api':
        return {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
          retryCondition: (error) => 
            error.retryable && 
            ['NETWORK_ERROR', 'SERVER_ERROR', 'RATE_LIMIT_EXCEEDED'].includes(error.code)
        };

      case 'deployment':
        return {
          maxAttempts: 5,
          baseDelay: 2000,
          maxDelay: 10000,
          retryCondition: (error) => 
            error.retryable && 
            !['VALIDATION_ERROR', 'AUTHENTICATION_ERROR'].includes(error.code)
        };

      case 'validation':
        return {
          maxAttempts: 1, // Don't retry validation errors
          baseDelay: 0,
          maxDelay: 0,
          retryCondition: () => false
        };

      default:
        return this.DEFAULT_OPTIONS;
    }
  }

  /**
   * Check if an error is worth retrying based on common patterns
   */
  static isRetryableError(error: any): boolean {
    const enhancedError = ErrorHandler.parseApiError(error);
    return enhancedError.retryable;
  }

  /**
   * Get human-readable retry status
   */
  static getRetryStatus(attempt: number, maxAttempts: number, error: EnhancedError): string {
    if (attempt === maxAttempts) {
      return `Final attempt failed: ${error.message}`;
    } else {
      return `Attempt ${attempt}/${maxAttempts} failed: ${error.message}. Retrying...`;
    }
  }
}