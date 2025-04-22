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
  status: 'sending' | 'sent' | 'blocked' | 'error'; // Status of the request attempt - Added 'sending' and 'error'
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
  // Generate ID outside the object for easier reference
  const entryId = Date.now() + Math.random(); 
  let logEntry: RequestLogEntry = {
    id: entryId,
    timestamp: new Date().toISOString(),
    method: method,
    path: path,
    url: url,
    options: { ...options }, // Clone options
    body: originalBody !== undefined ? originalBody : options.body,
    // Initial status depends on whether we intend to send
    status: sendRequests.value ? 'sending' : 'blocked', 
  };
  // Clean up the temporary property from the options clone
  if (logEntry.options && (logEntry.options as any)._originalBodyForLogging !== undefined) {
    delete (logEntry.options as any)._originalBodyForLogging;
  }

  // Add the initial entry to the log immediately
  addLogEntry(logEntry);

  // Decide whether to actually send the request
  if (!sendRequests.value) {
    console.warn(`HTTP request blocked by client control: ${method} ${url}`);
    // No need to add again, already added with 'blocked' status
    // Return a mock response
    return new Response(JSON.stringify({ message: "Request blocked by client-side control" }), {
      status: 418, // I'm a teapot
      statusText: "Blocked by Client Control",
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- If we are sending, proceed with the actual fetch ---
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: defaultHeaders,
    });

    // Find the existing log entry to update it
    const existingEntryIndex = requestLog.value.findIndex(e => e.id === entryId);
    if (existingEntryIndex === -1) {
        console.error("Could not find log entry to update after request success:", entryId);
        // Fallback: Add as a new entry (shouldn't happen ideally)
        // logEntry.status = 'sent'; 
        // addLogEntry(logEntry); 
        // Or just return? Decide error handling strategy.
        // For now, we'll proceed assuming it will be found, but log the error.
    }
    
    // Capture response data for logging
    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((value, key) => { responseHeaders[key] = value; });

    let responseBody: any = null;
    const responseTime = Date.now(); // Capture time before async body reading
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

    // Update the existing log entry with response info
    if (existingEntryIndex !== -1) {
        const entryToUpdate = requestLog.value[existingEntryIndex];
        entryToUpdate.status = 'sent'; // Mark as completed
        entryToUpdate.responseStatus = res.status;
        entryToUpdate.responseStatusText = res.statusText;
        entryToUpdate.responseHeaders = responseHeaders;
        entryToUpdate.responseBody = responseBody;
        entryToUpdate.responseTime = responseTime;

        // If response was not OK, add error details too
        if (!res.ok) {
          entryToUpdate.status = 'error'; // More specific status
          let errorBody = '';
          try {
            // Try to read body again for error message (if not already read)
            errorBody = typeof responseBody === 'string' ? responseBody : await res.text();
          } catch (e) { /* Ignore */ }
          entryToUpdate.error = `HTTP error! status: ${res.status} ${res.statusText}. ${errorBody}`.trim();
          // No need to throw here within the update logic, let the outer check handle it
        }
    } 
    // Removed the separate addLogEntry call here

    if (!res.ok) {
      // Find the entry again to ensure error message is set if previous update failed
      const errorEntryIndex = requestLog.value.findIndex(e => e.id === entryId);
      let errorMessage = `HTTP error! status: ${res.status} ${res.statusText}.`;
      if (errorEntryIndex !== -1) {
          errorMessage = requestLog.value[errorEntryIndex].error || errorMessage; // Use detailed error if available
      }
      throw new Error(errorMessage);
    }
    return res; // Return the actual response

  } catch (err: any) {
    console.error(`Error making request to ${url}:`, err.message);
    // Find the existing log entry to update with error details
    const errorEntryIndex = requestLog.value.findIndex(e => e.id === entryId);

    if (errorEntryIndex !== -1) {
        const entryToUpdate = requestLog.value[errorEntryIndex];
        entryToUpdate.status = 'error'; // Mark as error
        entryToUpdate.error = err.message || 'Network request failed. Is the backend server running?';
        entryToUpdate.responseTime = Date.now();
    } else {
        console.error("Could not find log entry to update after request error:", entryId);
        // Fallback? Maybe add a new minimal error entry?
        // logEntry.status = 'error';
        // logEntry.error = err.message;
        // logEntry.responseTime = Date.now();
        // addLogEntry(logEntry); // Add the error entry if original wasn't found
    }
    // Removed the separate addLogEntry call here
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