import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function VSCodeLikeLayout() {
  return (
    <div className="min-h-screen grid grid-cols-[200px_minmax(0,1fr)_350px] gap-4 p-4 bg-gray-50 text-gray-900">
      {/* Left Control Panel */}
      <Card className="shadow-md rounded-2xl">
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

      {/* Middle Tabbed Document Window */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl bg-white shadow-md flex flex-col"
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

      {/* Right Chat Box */}
      <Card className="shadow-md rounded-2xl flex flex-col">
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full">
          <div className="flex-grow overflow-auto space-y-2 mb-4">
            {/* Chat messages would go here */}
            <div className="p-2 bg-gray-100 rounded-xl">Hello! How can I help you?</div>
            <div className="p-2 bg-blue-100 rounded-xl self-end">I have a question...</div>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Type your message" className="flex-grow" />
            <Button variant="default">Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
