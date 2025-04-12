import { ref } from 'vue';

const BASE_URL = 'http://127.0.0.1:8000'; // Base URL for the backend
const MAX_LOG_ENTRIES = 50; // Keep the last 50 log entries

// --- Reactive Controls and Log ---
// Removed logRequests ref - logging is always active for the rolling log
export const sendRequests = ref(true); // Enable/disable actually sending requests (when false = preview mode)
export const requestLog = ref<RequestLogEntry[]>([]); // Array to store logged request details

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
  responseStatus?: number; // HTTP status code of the response
  responseStatusText?: string; // HTTP status text of the response
  responseHeaders?: Record<string, string>; // Response headers
  responseBody?: any; // Response body data
  responseTime?: number; // Time when response was received
  error?: string; // Error message if request failed
}

// Helper function to add entry to log and maintain size limit
const addLogEntry = (entry: RequestLogEntry) => {
  requestLog.value.push(entry);
  // Trim the log if it exceeds the maximum size
  if (requestLog.value.length > MAX_LOG_ENTRIES) {
    requestLog.value.shift(); // Remove the oldest entry
  }
};

// Generic function to handle HTTP requests
const request = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const url = `${BASE_URL}${path}`;
  const method = options.method || 'GET'; // Default to GET if not specified
  
  // Prepare log entry - always prepare, logging is now always active
  const originalBody = (options as any)._originalBodyForLogging;
  let logEntry: Partial<RequestLogEntry> = {
    id: Date.now() + Math.random(), // Add random element for higher uniqueness chance
    timestamp: new Date().toISOString(),
    method: method,
    path: path,
    url: url,
    options: { ...options }, // Clone options
    body: originalBody !== undefined ? originalBody : options.body,
    status: sendRequests.value ? 'sent' : 'blocked',
  };
  // Clean up the temporary property from the options clone
  if (logEntry.options && (logEntry.options as any)._originalBodyForLogging !== undefined) {
    delete (logEntry.options as any)._originalBodyForLogging;
  }

  // Decide whether to actually send the request
  if (!sendRequests.value) {
    console.warn(`HTTP request blocked by client control: ${method} ${url}`);
    logEntry.status = 'blocked';
    addLogEntry(logEntry as RequestLogEntry); // Add the blocked entry to the log
    // Return a mock response
    return new Response(JSON.stringify({ message: "Request blocked by client-side control" }), {
      status: 418, // I'm a teapot
      statusText: "Blocked by Client Control",
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // If we are sending, proceed with the actual fetch
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    // Capture response data for logging
   
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => { responseHeaders[key] = value; });

    let responseBody: any = null;
    try {
      const contentType = res.headers.get('content-type');
      const resClone = res.clone(); // Clone before reading
      if (contentType && contentType.includes('application/json')) {
        responseBody = await resClone.json();
      } else if (contentType && contentType.includes('text/')) {
        responseBody = await resClone.text();
      } else {
        const blob = await resClone.blob();
        responseBody = `Binary data (${blob.size} bytes)`;
      }
    } catch (e) {
      responseBody = "Could not parse response body";
    }

    // Add response info to the log entry
    logEntry.status = 'sent';
    logEntry.responseStatus = res.status;
    logEntry.responseStatusText = res.statusText;
    logEntry.responseHeaders = responseHeaders;
    logEntry.responseBody = responseBody;
    logEntry.responseTime = Date.now();

    addLogEntry(logEntry as RequestLogEntry); // Add the completed entry to the log

    if (!res.ok) {
      let errorBody = '';
      try {
        errorBody = await res.text();
      } catch (e) { /* Ignore */ }
      // Update log entry with error status if available
      if (logEntry.responseStatus) { // Check if it was added already
         const existingEntryIndex = requestLog.value.findIndex(e => e.id === logEntry!.id);
         if(existingEntryIndex !== -1) {
           requestLog.value[existingEntryIndex].error = `HTTP error! status: ${res.status} ${res.statusText}. ${errorBody}`.trim();
         }
      }
      throw new Error(`HTTP error! status: ${res.status} ${res.statusText}. ${errorBody}`.trim());
    }
    return res; // Return the actual response

  } catch (err: any) {
    console.error(`Error making request to ${url}:`, err.message);
    // Log the error if it's a network error (before response handling)
    logEntry.status = 'sent'; // Attempt was made
    logEntry.error = err.message;
    logEntry.responseTime = Date.now();
    addLogEntry(logEntry as RequestLogEntry); // Add the error entry to the log
    throw new Error(err.message || 'Network request failed. Is the backend server running?');
  }
};

// --- Generic HTTP Methods (Updated to pass body separately for logging) ---

export const get = async (path: string, options?: Omit<RequestInit, 'method'>): Promise<Response> => {
  return request(path, { ...options, method: 'GET' });
};

export const post = async (path: string, body: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<Response> => {
  const requestOptions: RequestInit = {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  };
  // Add temporary property for logging original body
  (requestOptions as any)._originalBodyForLogging = body;
  return request(path, requestOptions);
};

export const put = async (path: string, body: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<Response> => {
  const requestOptions: RequestInit = {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  };
  // Add temporary property for logging original body
  (requestOptions as any)._originalBodyForLogging = body;
  return request(path, requestOptions);
};

export const del = async (path: string, options?: Omit<RequestInit, 'method'>): Promise<Response> => {
  return request(path, { ...options, method: 'DELETE' });
};