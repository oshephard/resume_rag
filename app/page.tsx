import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="z-10 max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Document RAG System
          </h1>
          <p className="text-lg text-gray-600">
            Upload documents and ask questions using AI-powered retrieval.
          </p>
        </div>
        <div className="space-y-8">
          <DocumentUpload />
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}

