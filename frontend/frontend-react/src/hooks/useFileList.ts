import { useState, useEffect } from 'react';
import { useLoggingStore, LogLevel } from '../stores/loggingStore';
import { API_ENDPOINTS } from '../config/constants';

export function useFileList(fileType: 'document' | 'chat' | 'prompt' = 'document') {
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const log = useLoggingStore(state => state.log);
  const namespace = '📁 FileList:';

  const fetchFiles = async () => {
    if (!fileType) {
      log(LogLevel.ERROR, namespace, 'No file type specified');
      return;
    }

    try {
      setIsLoading(true);
      const endpoint = fileType === 'document' 
        ? API_ENDPOINTS.LIST_DOCUMENTS 
        : API_ENDPOINTS.LIST_CHATS;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      log(LogLevel.DEBUG, namespace, `${fileType} files received from server:`, data);
      
      setFiles(data.files || []);
    } catch (error) {
      log(LogLevel.ERROR, namespace, `Failed to fetch ${fileType} files:`, error);
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [fileType]); // Re-fetch when fileType changes

  return { files, isLoading, refreshFiles: fetchFiles };
} 