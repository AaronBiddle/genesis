import ChatSidebar from './components/ChatSidebar';
import CodeEditorPanel from './components/CodeEditorPanel';

function App(): JSX.Element {
  return (
    <div className="bg-gray-100 h-screen flex items-center justify-center">
      <div className="w-11/12 h-5/6 bg-white shadow-lg rounded-lg flex flex-row flex-nowrap">
        <ChatSidebar />
        <CodeEditorPanel />
      </div>
    </div>
  );
}

export default App;
