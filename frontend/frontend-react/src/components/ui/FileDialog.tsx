import React, { useState, useEffect } from 'react';
import { useFileList } from '../../hooks/useFileList';
import { Button } from './button';

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
  const { files, isLoading, refreshFiles } = useFileList(type);
  const [filename, setFilename] = useState(defaultFilename);
  const [loadPrompt, setLoadPrompt] = useState(true);

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
    // Initial fetch of files
    refreshFiles();
    // Don't include refreshFiles in dependency array
  }, []); // Empty dependency array

  const handleSelect = () => {
    if (!filename) return;
    
    // Add extension if not present
    let finalFilename = filename;
    if (!finalFilename.endsWith(typeInfo.extension)) {
      finalFilename += typeInfo.extension;
    }
    
    // Pass loadPrompt option only for chat files in open mode
    const options = (type === 'chat' && mode === 'open') ? { loadPrompt } : undefined;
    onSelect(finalFilename, options);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-[500px] max-w-[90vw]">
        <h2 className="text-lg font-semibold mb-4">{dialogTitle}</h2>
        
        {mode === 'open' && (
          <div className="mb-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-60">
                <span className="text-gray-500">Loading files...</span>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-60 overflow-auto">
                  {files.length === 0 ? (
                    <div className="p-4 text-gray-500 text-center">
                      No files found
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {files.map(file => (
                        <li
                          key={file}
                          className="p-2 hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => setFilename(file)}
                        >
                          <div className={`p-2 rounded ${filename === file ? 'bg-blue-100' : ''}`}>
                            {file}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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