import React, { useState, useEffect } from 'react';
import { useFileList } from '../../hooks/useFileList';
import { Button } from './button';
import { DirectoryBrowser } from '../DirectoryBrowser';
import { API_ENDPOINTS } from '../../config/constants';

export type FileType = 'chat' | 'document' | 'prompt';

interface FileDialogProps {
  mode: 'open' | 'save';
  type: FileType;
  defaultFilename?: string;
  onSelect: (filename: string, options?: { loadPrompt?: boolean }) => void;
  onCancel: () => void;
  title?: string;
}

export const FileDialog: React.FC<FileDialogProps> = ({
  mode,
  type,
  defaultFilename = '',
  onSelect,
  onCancel,
  title
}) => {
  const { refreshFiles } = useFileList(type);
  const [filename, setFilename] = useState(defaultFilename);
  const [currentPath, setCurrentPath] = useState("");
  const [loadPrompt, setLoadPrompt] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get display information based on file type
  const getTypeInfo = (type: FileType) => {
    switch (type) {
      case 'chat':
        return {
          title: 'Chat',
          extension: '.json',
          placeholder: 'e.g., work/meeting-notes'
        };
      case 'document':
        return {
          title: 'Document',
          extension: '.md',
          placeholder: 'e.g., docs/readme'
        };
      case 'prompt':
        return {
          title: 'System Prompt',
          extension: '.txt',
          placeholder: 'e.g., prompts/coding-assistant'
        };
    }
  };

  const typeInfo = getTypeInfo(type);
  const dialogTitle = title || `${mode === 'open' ? 'Open' : 'Save'} ${typeInfo.title}`;

  useEffect(() => {
    refreshFiles();
  }, []);

  const handleSelect = () => {
    if (!filename) return;
    
    // Add extension if not present and filename doesn't already have it
    let finalFilename = filename;
    if (!finalFilename.endsWith(typeInfo.extension)) {
      finalFilename += typeInfo.extension;
    }
    
    // For 'save' mode, combine with current path
    // For 'open' mode, use the filename as-is (it contains the full path from DirectoryBrowser)
    const fullPath = mode === 'save' && currentPath 
      ? `${currentPath}/${finalFilename}` 
      : finalFilename;
    
    const options = (type === 'chat' && mode === 'open') ? { loadPrompt } : undefined;
    onSelect(fullPath, options);
  };

  // New function to create a directory
  const handleNewFolder = async () => {
    const folderName = prompt("Enter new folder name");
    if (!folderName) return;
    const newFolderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    try {
      const response = await fetch(
        `${API_ENDPOINTS.CREATE_DIRECTORY}?file_type=${type}&path=${encodeURIComponent(newFolderPath)}`,
        { method: 'POST' }
      );
      if (!response.ok) {
        alert("Failed to create folder");
        return;
      }
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Error creating folder");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[500px] max-w-[90vw]">
        <h2 className="text-lg font-semibold mb-4">{dialogTitle}</h2>
        
        {/* Show New Folder button only in 'save' mode */}
        {mode === 'save' && (
          <Button variant="outline" onClick={handleNewFolder} className="mb-2">
            New Folder
          </Button>
        )}

        <DirectoryBrowser
          key={refreshKey}
          onFileSelect={(path) => {
            setFilename(path);
          }}
          fileFilter={[typeInfo.extension]}
          fileType={type}
          onPathChange={(path) => setCurrentPath(path)}
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {mode === 'open' ? 'Selected File' : 'Save As'}
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder={typeInfo.placeholder}
          />
          <p className="mt-1 text-sm text-gray-500">
            {mode === 'save' && `File will be saved with ${typeInfo.extension} extension`}
          </p>
        </div>

        {type === 'chat' && mode === 'open' && (
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={loadPrompt}
                onChange={(e) => setLoadPrompt(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Load associated system prompt
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSelect}
            disabled={!filename.trim()}
          >
            {mode === 'open' ? 'Open' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}; 