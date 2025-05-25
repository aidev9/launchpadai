import { ErrorLogInput } from "@/lib/firebase/schema";

/**
 * Determines the error type based on the error object or message
 */
export function determineErrorType(
  error: Error | string | any
): ErrorLogInput["errorType"] {
  if (typeof error === "string") {
    const errorLower = error.toLowerCase();

    if (errorLower.includes("firebase") || errorLower.includes("firestore")) {
      return "firebase";
    }
    if (
      errorLower.includes("network") ||
      errorLower.includes("fetch") ||
      errorLower.includes("connection")
    ) {
      return "network";
    }
    if (errorLower.includes("validation") || errorLower.includes("invalid")) {
      return "validation";
    }
    return "unknown";
  }

  if (error instanceof Error) {
    const errorName = error.name.toLowerCase();
    const errorMessage = error.message.toLowerCase();

    // Firebase errors
    if (
      errorName.includes("firebase") ||
      errorMessage.includes("firebase") ||
      errorMessage.includes("firestore") ||
      errorMessage.includes("auth")
    ) {
      return "firebase";
    }

    // Network errors
    if (
      errorName.includes("network") ||
      errorMessage.includes("network") ||
      errorName.includes("fetch") ||
      errorMessage.includes("fetch") ||
      errorMessage.includes("connection") ||
      errorMessage.includes("timeout")
    ) {
      return "network";
    }

    // Validation errors
    if (
      errorName.includes("validation") ||
      errorMessage.includes("validation") ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("required")
    ) {
      return "validation";
    }

    // JavaScript errors
    if (
      errorName.includes("reference") ||
      errorName.includes("type") ||
      errorName.includes("syntax") ||
      errorName.includes("range")
    ) {
      return "javascript";
    }

    return "unknown";
  }

  return "unknown";
}

/**
 * Determines the error severity based on the error type and message
 */
export function determineErrorSeverity(
  error: Error | string | any
): ErrorLogInput["severity"] {
  const errorType = determineErrorType(error);
  const errorMessage = typeof error === "string" ? error : error?.message || "";
  const errorMessageLower = errorMessage.toLowerCase();

  // Critical errors
  if (
    errorMessageLower.includes("authentication failed") ||
    errorMessageLower.includes("permission denied") ||
    errorMessageLower.includes("database connection") ||
    errorMessageLower.includes("server error") ||
    errorMessageLower.includes("internal error")
  ) {
    return "critical";
  }

  // High severity errors
  if (
    errorType === "firebase" ||
    errorMessageLower.includes("failed to") ||
    errorMessageLower.includes("cannot") ||
    errorMessageLower.includes("unauthorized")
  ) {
    return "high";
  }

  // Medium severity errors
  if (
    errorType === "network" ||
    errorType === "validation" ||
    errorMessageLower.includes("timeout") ||
    errorMessageLower.includes("not found")
  ) {
    return "medium";
  }

  // Low severity errors (mostly UI/UX issues)
  if (
    errorType === "javascript" ||
    errorMessageLower.includes("warning") ||
    errorMessageLower.includes("deprecated")
  ) {
    return "low";
  }

  return "medium"; // Default to medium
}

/**
 * Extracts component name from error stack or current location
 */
export function extractComponentName(
  error?: Error | string
): string | undefined {
  if (!error) return undefined;

  const stack = typeof error === "string" ? error : error.stack;
  if (!stack) return undefined;

  // Try to extract React component name from stack trace
  const componentMatch = stack.match(
    /at (\w+(?:Component|Page|Layout|Provider))/
  );
  if (componentMatch) {
    return componentMatch[1];
  }

  // Try to extract function name
  const functionMatch = stack.match(/at (\w+)/);
  if (functionMatch) {
    return functionMatch[1];
  }

  return undefined;
}

/**
 * Generates a unique error code based on error type and timestamp
 */
export function generateErrorCode(
  errorType: ErrorLogInput["errorType"]
): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const typePrefix = errorType.substring(0, 3).toUpperCase();

  return `${typePrefix}-${timestamp}-${random}`;
}

/**
 * Sanitizes error data to remove sensitive information
 */
export function sanitizeErrorData(error: any): {
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
} {
  if (typeof error === "string") {
    return {
      message: error,
    };
  }

  if (error instanceof Error) {
    // Remove sensitive information from stack trace
    const sanitizedStack = error.stack
      ?.replace(/\/Users\/[^\/]+/g, "/Users/***")
      ?.replace(/\/home\/[^\/]+/g, "/home/***")
      ?.replace(/api[_-]?key[s]?[=:]\s*[^\s&]+/gi, "api_key=***")
      ?.replace(/token[s]?[=:]\s*[^\s&]+/gi, "token=***")
      ?.replace(/password[s]?[=:]\s*[^\s&]+/gi, "password=***");

    // Remove sensitive information from error message
    const sanitizedMessage = error.message
      ?.replace(/api[_-]?key[s]?[=:]\s*[^\s&]+/gi, "api_key=***")
      ?.replace(/token[s]?[=:]\s*[^\s&]+/gi, "token=***")
      ?.replace(/password[s]?[=:]\s*[^\s&]+/gi, "password=***");

    const metadata: Record<string, any> = {
      name: error.name,
    };

    // Only add cause if it's not undefined
    if (error.cause !== undefined) {
      metadata.cause = error.cause;
    }

    return {
      message: sanitizedMessage || "Unknown error",
      stack: sanitizedStack,
      metadata,
    };
  }

  // Handle other types of errors
  const metadata: Record<string, any> = {
    type: typeof error,
  };

  // Only add constructor if it's not undefined
  if (error?.constructor?.name !== undefined) {
    metadata.constructor = error.constructor.name;
  }

  return {
    message: String(error),
    metadata,
  };
}

/**
 * Removes undefined values from an object recursively
 */
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues).filter((item) => item !== undefined);
  }

  if (typeof obj === "object") {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Creates a complete error log input object
 */
export function createErrorLogInput(
  error: Error | string | any,
  options: {
    component?: string;
    action?: string;
    metadata?: Record<string, any>;
  } = {}
): ErrorLogInput {
  const sanitized = sanitizeErrorData(error);
  const errorType = determineErrorType(error);
  const severity = determineErrorSeverity(error);
  const errorCode = generateErrorCode(errorType);
  const component = options.component || extractComponentName(error);

  const errorLogInput = {
    url: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    errorCode,
    errorMessage: sanitized.message,
    errorStack: sanitized.stack,
    errorType,
    severity,
    component,
    action: options.action,
    metadata: {
      ...sanitized.metadata,
      ...options.metadata,
    },
  };

  // Remove any undefined values before returning
  return removeUndefinedValues(errorLogInput) as ErrorLogInput;
}
