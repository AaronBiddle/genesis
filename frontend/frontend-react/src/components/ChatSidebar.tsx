import React from 'react';

const ChatSidebar: React.FC = () => {
  return (
    <aside className="w-1/4 bg-gray-50 p-4 flex flex-col">
      <div className="flex justify-between items-center bg-gray-200 px-2 py-1 rounded-md shadow-sm mb-2">
        <h2 className="text-lg font-bold">Chat</h2>
      </div>
      
      <select className="mb-2 p-2 border rounded-md bg-white" id="chat-selector">
        <option>Recent Chat 1</option>
        <option>Recent Chat 2</option>
        <option>Recent Chat 3</option>
        <option>Recent Chat 4</option>
        <option>Recent Chat 5</option>
        <option>Recent Chat 6</option>
        <option>Recent Chat 7</option>
        <option>Recent Chat 8</option>
        <option>Recent Chat 9</option>
        <option>Recent Chat 10</option>
        <option>Other...</option>
      </select>
      
      <div className="flex-1 overflow-y-auto border p-2 rounded-md bg-white">
        <p>
          <span className="font-bold text-blue-600">User:</span>{" "}
          <span className="text-gray-700">How do I refactor this function?</span>
        </p>
        <p>
          <span className="font-bold text-green-600">AI:</span>{" "}
          <span className="text-gray-600">You can break it into smaller functions to improve readability.</span>
        </p>
        <p>
          <span className="font-bold text-blue-600">User:</span>{" "}
          <span className="text-gray-700">Can you give me an example?</span>
        </p>
        <p>
          <span className="font-bold text-green-600">AI:</span>{" "}
          <span className="text-gray-600">Sure! Here's a more modular version of your function...</span>
        </p>
      </div>
      
      <input 
        type="text" 
        placeholder="Type a message..." 
        className="p-2 border rounded-md w-full mt-2" 
      />
      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mt-2">
        Send
      </button>
    </aside>
  );
};

export default ChatSidebar;
