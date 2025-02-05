import { ReactNode, useState } from 'react';
import { Rnd } from 'react-rnd';
import { X } from 'lucide-react';

interface WindowProps {
  title: string;
  type: 'chat' | 'code';
  onClose: () => void;
  children: ReactNode;
}

const Window = ({ title, type, onClose, children }: WindowProps) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <Rnd
      default={{
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        width: 400,
        height: 300
      }}
      minWidth={300}
      minHeight={200}
      bounds="parent"
      enableResizing={{
        bottom: true,
        bottomLeft: true,
        bottomRight: true,
        left: true,
        right: true,
        top: true,
        topLeft: true,
        topRight: true
      }}
      dragHandleClassName="drag-handle"
      style={{ zIndex: isActive ? 100 : 1 }}
      onDragStart={() => setIsActive(true)}
      onResizeStart={() => setIsActive(true)}
    >
      <div className="h-full flex flex-col bg-white shadow-lg rounded-lg border border-gray-200">
        <div className="drag-handle flex justify-between items-center bg-gray-100 px-4 py-2 rounded-t-lg cursor-move">
          <h3 className="font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {children}
        </div>
      </div>
    </Rnd>
  );
};

export default Window;
