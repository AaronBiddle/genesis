import { useState } from 'react'
import { motion } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { useAIChat } from './hooks/useAIChat'
import { ResizableDivider } from './components/ui/resizable'
import './App.css'
import { ChatMessage } from './types/chat'
import ReactMarkdown from 'react-markdown'

export default function App() {
  const { messages, isConnected, sendPrompt } = useAIChat();
  const [inputMessage, setInputMessage] = useState('')
  const [leftWidth, setLeftWidth] = useState(200);
  const [rightWidth, setRightWidth] = useState(400);
  
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 800;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return
    sendPrompt(inputMessage.trim())
    setInputMessage('')
  }

  const handleLeftResize = (delta: number) => {
    setLeftWidth(prevWidth => {
      const newWidth = prevWidth + delta;
      return Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
    });
  };

  const handleRightResize = (delta: number) => {
    setRightWidth(prevWidth => {
      const newWidth = prevWidth - delta;
      return Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH);
    });
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
          <TabsContent value="tab1" className="p-4 markdown-content">
            <ReactMarkdown>{`# Main Heading

## Getting Started
Here's a sample list:
- First item with **bold text**
- Second item with *italic text*
- Third item with \`inline code\`

### Code Examples
Here's a simple TypeScript function:

\`\`\`typescript
function hello(name: string) {
  return "Hello, " + name;
}
\`\`\`

#### Additional Notes
You can also use markdown for:
- Links
- Tables
- Block quotes
- And more!
`}</ReactMarkdown>
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
        <div className="flex-grow overflow-auto p-4">
          {messages.map((message, index) => (
            <div key={index} className={`mb-4 ${message.role === 'assistant' ? 'pl-4' : 'pr-4'}`}>
              <div
                className={`p-2 rounded-lg markdown-content ${
                  message.role === 'assistant' ? 'bg-gray-100' : 'bg-blue-100 ml-auto'
                }`}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
              if (input.value.trim()) {
                sendPrompt(input.value);
                input.value = '';
              }
            }}
          >
            <div className="flex gap-2">
              <Input name="message" placeholder="Type your message..." className="flex-grow" />
              <Button type="submit">Send</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
