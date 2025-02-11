import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import ReactMarkdown from 'react-markdown';

export function TabbedWindow() {
  const markdownContent = `# Main Heading

## Getting Started
Here's a nested bullet list:
- First level item
  - Second level item
    - Third level item with **bold text**
  - Another second level
- First level with *italic text*
  - Second level with \`inline code\`
    - Third level item

## Numbered Lists
1. First level item
   1. Second level item
      1. Third level item
   2. Another second level
2. Back to first level
   1. More nested items
      1. Deep nested item

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
`;

  return (
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
          <ReactMarkdown>{markdownContent}</ReactMarkdown>
        </TabsContent>
        <TabsContent value="tab2" className="p-4">
          <p>Content of Tab Two</p>
        </TabsContent>
        <TabsContent value="tab3" className="p-4">
          <p>Content of Tab Three</p>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
} 