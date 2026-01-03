
import React, { useState, useRef, useEffect } from 'react';
import { Role, ChatMessage as ChatMessageType, AppState } from './types';
import { Icons } from './constants';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { generateStudyResponse, generateVisualAid } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    messages: [
      {
        id: 'welcome',
        role: Role.MODEL,
        parts: [{ text: JSON.stringify({
          finalAnswer: "Hello, I am VIBH. I am here to help you with your studies. You can ask me questions about Mathematics, Science, History, and more. Please share your topic or problem.",
          conceptContent: "",
          hasConcept: false
        }) }],
        timestamp: new Date()
      }
    ],
    isThinking: false,
    error: null
  });

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isThinking]);

  const handleSend = async (text: string, image?: { mimeType: string; data: string }) => {
    if (!text && !image) return;
    
    setInputText('');
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: Role.USER,
      parts: [
        ...(image ? [{ inlineData: image }] : []),
        ...(text ? [{ text }] : [])
      ],
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isThinking: true,
      error: null
    }));

    try {
      const response = await generateStudyResponse(
        text || "Analyze this image and explain the study content.", 
        state.messages,
        image ? { inlineData: image } : undefined
      );

      let visualAid = null;
      if (response.visualPrompt) {
        visualAid = await generateVisualAid(response.visualPrompt);
      }

      const modelMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        parts: [
          { text: response.text },
          ...(visualAid ? [{ generatedImage: visualAid }] : [])
        ],
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, modelMessage],
        isThinking: false
      }));
    } catch (err) {
      console.error(err);
      setState(prev => ({
        ...prev,
        isThinking: false,
        error: "An error occurred while connecting to VIBH. Please check your connection."
      }));
    }
  };

  const onTextSelected = (text: string) => {
    if (!text.trim()) return;
    setInputText(`Teacher, can you explain this part specifically? "${text}"`);
    setIsSelectionMode(false);
    // Focus the input if possible or just wait for user to hit send
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto shadow-sm bg-[#fcfcfc]">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 max-w-4xl mx-auto w-full z-50 bg-[#fcfcfc]/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Icons.Menu />
        </button>
        <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold tracking-tight text-gray-800">VIBH</h1>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Academic Assistant</span>
        </div>
        <div className="flex items-center gap-2">
           <button 
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className={`p-2 rounded-full transition-all border ${isSelectionMode ? 'bg-red-500 text-white border-red-500 shadow-md scale-110' : 'text-gray-400 border-gray-100 hover:bg-gray-100'}`}
            title="Red Pen Selection Tool"
           >
             <Icons.Pencil />
           </button>
           <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Icons.Profile />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-20 pb-32 px-4 md:px-8">
        {isSelectionMode && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-red-500 text-white px-6 py-2 rounded-full text-xs font-bold shadow-xl flex items-center gap-2">
              <Icons.Pencil />
              <span>Circle any text to explain it!</span>
              <button onClick={() => setIsSelectionMode(false)} className="ml-2 hover:opacity-70">×</button>
            </div>
          </div>
        )}
        <div className="flex flex-col">
          {state.messages.map(msg => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              isSelectionMode={isSelectionMode}
              onTextSelected={onTextSelected}
            />
          ))}
          
          {state.isThinking && (
            <div className="flex justify-start mb-16">
              <div className="bg-transparent p-2 flex items-center gap-3 text-gray-400 italic text-sm">
                <Icons.Loading />
                <span>VIBH is thinking...</span>
              </div>
            </div>
          )}
          
          {state.error && (
            <div className="text-center p-3 mb-8 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 shadow-sm mx-10">
              {state.error}
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Bottom Input Area */}
      <ChatInput onSend={handleSend} disabled={state.isThinking} value={inputText} />
    </div>
  );
};

export default App;
