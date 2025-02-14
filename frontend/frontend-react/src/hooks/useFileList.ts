import { useState, useEffect } from 'react';
import { useLoggingStore, LogLevel } from '../stores/loggingStore';

export function useFileList() {
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const log = useLoggingStore(state => state.log);
  const namespace = '📁 FileList:';

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/list_files');
      const data = await response.json();
      
      log(LogLevel.DEBUG, namespace, 'Files received from server:', data);
      
      setFiles(data.files || []); // Provide default empty array if data.files is undefined
    } catch (error) {
      log(LogLevel.ERROR, namespace, 'Failed to fetch files:', error);
      setFiles([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return { files, isLoading, refreshFiles: fetchFiles };
} 