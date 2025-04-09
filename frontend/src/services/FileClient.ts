import { get, post, put, del } from './HttpClient';

// Define the base path for file system operations
const FS_PATH = '/frontend/fs';

// Helper to construct URL-encoded query parameters
const encodeParams = (params: Record<string, string>): string => {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

// --- File System Operations ---

export const readFile = async (filePath: string): Promise<string> => {
  try {
    const params = encodeParams({ path: filePath });
    const response = await get(`${FS_PATH}/read?${params}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status} (${response.statusText}): ${errorText}`);
    }

    const data = await response.text(); // Read response as text
    return data;
  } catch (err: any) {
    console.error('FileClient: Error reading file:', err);
    throw new Error(err.message || 'Failed to read file. Is the backend server running?');
  }
};

export const writeFile = async (filePath: string, content: string): Promise<any> => {
  try {
    // Assuming the backend expects path and content in the JSON body for POST
    const response = await post(`${FS_PATH}/write`, { path: filePath, content });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status} (${response.statusText}): ${errorText}`);
    }

    return await response.json(); // Assuming backend confirms success with JSON
  } catch (err: any) {
    console.error('FileClient: Error writing file:', err);
    throw new Error(err.message || 'Failed to write file. Is the backend server running?');
  }
};

export const deleteFile = async (filePath: string): Promise<any> => {
  try {
    const params = encodeParams({ path: filePath });
    const response = await del(`${FS_PATH}/delete?${params}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status} (${response.statusText}): ${errorText}`);
    }

    return await response.json(); // Assuming backend confirms success with JSON
  } catch (err: any) {
    console.error('FileClient: Error deleting file:', err);
    throw new Error(err.message || 'Failed to delete file. Is the backend server running?');
  }
};

export const createDirectory = async (dirPath: string): Promise<any> => {
  try {
    // Assuming backend expects path and type in JSON body for PUT/POST
    const response = await put(`${FS_PATH}/create_dir`, { path: dirPath, type: 'directory' });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status} (${response.statusText}): ${errorText}`);
    }

    return await response.json(); // Assuming backend confirms success with JSON
  } catch (err: any) {
    console.error('FileClient: Error creating directory:', err);
    throw new Error(err.message || 'Failed to create directory. Is the backend server running?');
  }
};

export const listDirectory = async (dirPath: string): Promise<any> => {
  try {
    // Assuming listing is GET with the directory path as a query parameter
    const params = encodeParams({ path: dirPath });
    const response = await get(`${FS_PATH}/list_dir?${params}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status} (${response.statusText}): ${errorText}`);
    }

    const data = await response.json(); // Assuming backend returns JSON list
    return data;
  } catch (err: any) {
    console.error('FileClient: Error listing directory:', err);
    throw new Error(err.message || 'Failed to list directory. Is the backend server running?');
  }
};

export const deleteDirectory = async (dirPath: string): Promise<any> => {
  try {
    // Assuming deleting a directory is DELETE with the path as a query parameter
    const params = encodeParams({ path: dirPath });
    const response = await del(`${FS_PATH}/delete_dir?${params}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status} (${response.statusText}): ${errorText}`);
    }

    return await response.json(); // Assuming backend confirms success with JSON
  } catch (err: any) {
    console.error('FileClient: Error deleting directory:', err);
    throw new Error(err.message || 'Failed to delete directory. Is the backend server running?');
  }
};

// --- New Function for Getting Mounts ---

// Define the structure for mount information
export interface MountInfo {
  name: string;
  path: string;
  access: 'readonly' | 'readwrite'; // Assuming these are the possible values
}

export const getMounts = async (): Promise<MountInfo[]> => {
  try {
    // Assuming mounts endpoint is at FS_PATH/mounts
    const response = await get(`${FS_PATH}/mounts`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status} (${response.statusText}): ${errorText}`);
    }

    const data = await response.json(); // Assuming backend returns JSON list of mount objects

    // Updated validation for the MountInfo structure
    if (
      !Array.isArray(data) ||
      !data.every(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.name === 'string' &&
          typeof item.path === 'string' &&
          (item.access === 'readonly' || item.access === 'readwrite') // Check access validity
      )
    ) {
      console.error('Invalid mount data format received:', data); // Log the problematic data
      throw new Error('Invalid mount data format received from server');
    }
    return data as MountInfo[]; // Cast to the new type
  } catch (err: any) {
    console.error('FileClient: Error getting mounts:', err);
    throw new Error(err.message || 'Failed to get mounts. Is the backend server running?');
  }
}; 