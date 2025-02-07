import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { chatService } from './services/chatService'
import { ChatMessage } from './types/chat'
import './App.css'
import { ResizableDivider } from './components/ui/resizable'

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! How can I help you?' }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [leftWidth, setLeftWidth] = useState(200);
  const [rightWidth, setRightWidth] = useState(350);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await chatService.sendMessage([...messages, userMessage])
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
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
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full">
          <div className="flex-grow overflow-auto space-y-2 mb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-2 rounded-xl ${
                  message.role === 'assistant' 
                    ? 'bg-gray-100' 
                    : 'bg-blue-100 self-end'
                }`}
              >
                {message.content}
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
              disabled={isLoading}
            />
            <Button 
              variant="default" 
              onClick={handleSendMessage}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
