import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { useAIChat } from './hooks/useAIChat'
import { ResizableDivider } from './components/ui/resizable'
import './App.css'

export default function App() {
  const { messages, isConnected, sendPrompt } = useAIChat();
  const [inputMessage, setInputMessage] = useState('')
  const [leftWidth, setLeftWidth] = useState(200);
  const [rightWidth, setRightWidth] = useState(350);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return
    sendPrompt(inputMessage.trim())
    setInputMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLeftResize = (delta: number) => {
    setLeftWidth(prev => Math.min(Math.max(150, prev + delta), 400));
  };

  const handleRightResize = (delta: number) => {
    setRightWidth(prev => Math.min(Math.max(250, prev - delta), 500));
  };

  return (
    <div className="h-screen flex bg-gray-300 text-gray-900 pt-2 pb-2">
      {/* Left Control Panel */}
      <Card className="shadow-md rounded-2xl mx-1 my-2" style={{ width: leftWidth }}>
        <CardHeader>
          <CardTitle>Control Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Button variant="outline">Command 1</Button>
            <Button variant="outline">Command 2</Button>
            <Button variant="outline">Command 3</Button>
          </div>
        </CardContent>
      </Card>

      <ResizableDivider onResize={handleLeftResize} className="my-4" />

      {/* Middle Tabbed Document Window */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl bg-white shadow-md flex flex-col mx-1 my-2 flex-grow"
      >
        <Tabs defaultValue="tab1">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="tab1">Tab One</TabsTrigger>
            <TabsTrigger value="tab2">Tab Two</TabsTrigger>
            <TabsTrigger value="tab3">Tab Three</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="p-4">
            <p>Content of Tab One</p>
          </TabsContent>
          <TabsContent value="tab2" className="p-4">
            <p>Content of Tab Two</p>
          </TabsContent>
          <TabsContent value="tab3" className="p-4">
            <p>Content of Tab Three</p>
          </TabsContent>
        </Tabs>
      </motion.div>

      <ResizableDivider onResize={handleRightResize} className="my-4" />

      {/* Right Chat Box */}
      <Card className="shadow-md rounded-2xl mx-1 my-2 flex flex-col" style={{ width: rightWidth }}>
        <CardHeader>
          <CardTitle>Chat {isConnected ? '(Connected)' : '(Disconnected)'}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full">
          <div className="flex-grow overflow-auto space-y-2 mb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-2 rounded-xl ${
                  message.response 
                    ? 'bg-gray-100' 
                    : 'bg-blue-100 self-end'
                }`}
              >
                {message.response || message.prompt}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Type your message"
              className="flex-grow"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
            />
            <Button 
              variant="default" 
              onClick={handleSendMessage}
              disabled={!isConnected}
            >
              {!isConnected ? 'Connecting...' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
