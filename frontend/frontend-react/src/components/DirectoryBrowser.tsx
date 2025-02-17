import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFile, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

interface DirectoryItem {
  name: string;
  type: 'directory' | 'file';
  path: string;
}

interface DirectoryBrowserProps {
  onFileSelect?: (path: string) => void;
  fileFilter?: string[];
  fileType: 'chat' | 'document' | 'prompt';
}

export function DirectoryBrowser({ onFileSelect, fileFilter, fileType }: DirectoryBrowserProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState<DirectoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDirectory = async (path: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(
        `${API_BASE_URL}/directory/list/${encodeURIComponent(path)}?file_type=${fileType}`
      );
      if (!response.ok) throw new Error('Failed to fetch directory contents');
      
      const data = await response.json();
      
      // Filter files if fileFilter is provided
      const filteredItems = fileFilter 
        ? data.items.filter((item: DirectoryItem) => 
            item.type === 'directory' || 
            fileFilter.some(ext => item.name.endsWith(ext)))
        : data.items;
        
      setItems(filteredItems);
      setCurrentPath(data.current_path);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory(currentPath);
  }, []);

  const handleItemClick = (item: DirectoryItem) => {
    if (item.type === 'directory') {
      fetchDirectory(item.path);
    } else if (onFileSelect) {
      onFileSelect(item.path);
    }
  };

  const handleBackClick = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    fetchDirectory(parentPath);
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        {currentPath && (
          <button
            onClick={handleBackClick}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
        )}
        <span className="font-mono text-sm">
          /{currentPath}
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-4">
          <span>Loading...</span>
        </div>
      ) : error ? (
        <div className="text-red-500 p-4">
          {error}
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.path}
              onClick={() => handleItemClick(item)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
            >
              <FontAwesomeIcon 
                icon={item.type === 'directory' ? faFolder : faFile}
                className={item.type === 'directory' ? 'text-yellow-500' : 'text-gray-500'}
              />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 