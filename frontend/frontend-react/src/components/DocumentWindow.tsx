import React, { useEffect } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/default.css';

interface CodeEditorProps {
  initialContent?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ initialContent }) => {
  useEffect(() => {
    hljs.highlightAll();
  }, []);

  return (
    <div className="flex-1 border p-2 rounded-md bg-white overflow-auto">
      <pre>
        <code className="language-python">
{`def greet(name):
    return f"Hello, {name}!"

def farewell(name):
    return f"Goodbye, {name}. See you soon!"

print(greet("Alice"))
print(farewell("Bob"))`}
        </code>
      </pre>
    </div>
  );
};

export default CodeEditor;