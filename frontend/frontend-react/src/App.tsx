import { useState } from 'react'
import { ResizableDivider } from './components/ui/resizable'
import { ControlPanel } from './components/ControlPanel'
import { TabbedWindow } from './components/TabbedWindow'
import { ChatBox } from './components/ChatBox'
import './App.css'

export default function App() {
  const [leftWidth, setLeftWidth] = useState(200);
  const [rightWidth, setRightWidth] = useState(400);

  const MIN_WIDTH = 200;
  const MAX_WIDTH = 1000;

  const handleLeftResize = (delta: number) => {
    setLeftWidth((prevWidth) => {
      const newWidth = prevWidth + delta;
      return Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
    });
  };

  const handleRightResize = (delta: number) => {
    setRightWidth((prevWidth) => {
      const newWidth = prevWidth - delta;
      return Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
    });
  };

  return (
    <div className="h-screen flex bg-gray-300 text-gray-900 pt-2 pb-2">
      {/* Left Control Panel */}
      <ControlPanel width={leftWidth} />

      <ResizableDivider onResize={handleLeftResize} className="my-4" />

      {/* Middle Tabbed Document Window */}
      <TabbedWindow />

      <ResizableDivider onResize={handleRightResize} className="my-4" />

      {/* Right Chat Box */}
      <ChatBox width={rightWidth} />
    </div>
  )
}
