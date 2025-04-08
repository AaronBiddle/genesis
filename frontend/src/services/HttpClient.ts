import { ref } from 'vue';

const BASE_URL = 'http://127.0.0.1:8000'; // Base URL for the backend

// --- Reactive Controls and Log ---
export const logRequests = ref(false); // Enable/disable logging
export const sendRequests = ref(true); // Enable/disable actually sending requests
export const requestLog = ref<any[]>([]); // Array to store logged request details

// --- Log Entry Structure ---
interface RequestLogEntry {
  id: number;
  timestamp: string;
  method: string;
  path: string;
  url: string;
  options: RequestInit;
  body?: any; // Store body before stringification if possible
  status: 'sent' | 'blocked' | 'logged_only'; // Status of the request attempt
}

// Generic function to handle HTTP requests
const request = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const url = `${BASE_URL}${path}`;
  const method = options.method || 'GET'; // Default to GET if not specified
  let logEntry: Partial<RequestLogEntry> | null = null;

  // Prepare log entry if logging is enabled
  if (logRequests.value) {
    // Check if the original body was passed for logging
    const originalBody = (options as any)._originalBodyForLogging;

    logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      method: method,
      path: path,
      url: url,
      options: { ...options }, // Clone options
      // Log the original body if available, otherwise fallback to options.body (which might be stringified)
      body: originalBody !== undefined ? originalBody : options.body,
      status: sendRequests.value ? 'sent' : 'blocked', // Tentative status
    };
    // Clean up the temporary property from the options clone if it exists
    if (logEntry.options && (logEntry.options as any)._originalBodyForLogging !== undefined) {
      delete (logEntry.options as any)._originalBodyForLogging;
    }
  }

  // Decide whether to actually send the request
  if (!sendRequests.value) {
    console.warn(`HTTP request blocked by client control: ${method} ${url}`);
    if (logEntry) {
        logEntry.status = 'blocked';
        requestLog.value.push(logEntry as RequestLogEntry);
    }
    // Return a mock response to fulfill the promise type without hitting the network
    // 418 I'm a teapot is a fun status for this
    return new Response(JSON.stringify({ message: "Request blocked by client-side control" }), {
      status: 418, // I'm a teapot
      statusText: "Blocked by Client Control",
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // If we are sending, proceed with the actual fetch
  // Default headers, can be overridden by options
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    // Finalize log entry after request attempt (success or HTTP error)
    if (logEntry) {
        logEntry.status = 'sent'; // Update status if it was sent
        requestLog.value.push(logEntry as RequestLogEntry);
    }

    if (!res.ok) {
      let errorBody = '';
      try {
        errorBody = await res.text();
      } catch (e) { /* Ignore */ }
      throw new Error(`HTTP error! status: ${res.status} ${res.statusText}. ${errorBody}`.trim());
    }
    return res; // Return the actual response
  } catch (err: any) {
    console.error(`Error making request to ${url}:`, err.message);
    // Log the error even if the initial log entry wasn't added (e.g., logRequests was false initially)
    // Consider adding error details to the log entry if it exists
    throw new Error(err.message || 'Network request failed. Is the backend server running?');
  }
};

// --- Generic HTTP Methods (Updated to pass body separately for logging) ---

export const get = async (path: string, options?: Omit<RequestInit, 'method'>): Promise<Response> => {
  return request(path, { ...options, method: 'GET' });
};

export const post = async (path: string, body: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<Response> => {
  // Pass body separately to log the original object before stringification
  const requestOptions: RequestInit = {
    ...options,
    method: 'POST',
    body: JSON.stringify(body), // Stringify here
  };
  // Add temporary property IF logging is enabled
  if (logRequests.value) {
    (requestOptions as any)._originalBodyForLogging = body;
  }
  return request(path, requestOptions);
};

export const put = async (path: string, body: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<Response> => {
  const requestOptions: RequestInit = {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  };
  // Add temporary property IF logging is enabled
  if (logRequests.value) {
    (requestOptions as any)._originalBodyForLogging = body;
  }
  return request(path, requestOptions);
};

export const del = async (path: string, options?: Omit<RequestInit, 'method'>): Promise<Response> => {
  return request(path, { ...options, method: 'DELETE' });
};

// --- Removed Echo Example --- 