import React from 'react';
import { FolderOpen, Save, XCircle } from 'lucide-react';
import CodeEditor from './CodeEditor';

const CodeEditorPanel: React.FC = () => {
  return (
    <main className="w-3/4 p-4 flex flex-col">
      <div className="flex items-center mb-2">
        <div className="bg-gray-200 px-2 py-1 rounded-md shadow-sm flex-grow">
          <h2 className="text-lg font-bold">Code Editor</h2>
        </div>
        <div className="flex space-x-1 ml-2">
          <button className="p-1 rounded hover:bg-gray-300" title="Open Project">
            <FolderOpen />
          </button>
          <button className="p-1 rounded hover:bg-gray-300" title="Save Project">
            <Save />
          </button>
          <button className="p-1 rounded hover:bg-gray-300" title="Close Project">
            <XCircle />
          </button>
        </div>
      </div>
      
      <div className="flex space-x-1 bg-white border border-gray-300 px-2 py-1 rounded-md shadow-sm mb-2">
        <select className="px-2 py-1 border rounded-md bg-white">
          <option>Recent File 1</option>
          <option>Recent File 2</option>
          <option>Recent File 3</option>
          <option>Recent File 4</option>
          <option>Recent File 5</option>
          <option>Recent File 6</option>
          <option>Recent File 7</option>
          <option>Recent File 8</option>
          <option>Recent File 9</option>
          <option>Recent File 10</option>
          <option>New...</option>
          <option>Open...</option>
        </select>
        <button className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
        <button className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Undo</button>
        <button className="px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Redo</button>
        <button className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">AI Suggest</button>
      </div>
      
      <CodeEditor />
    </main>
  );
};

export default CodeEditorPanel;