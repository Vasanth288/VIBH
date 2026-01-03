
import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../constants';

interface Props {
  onSend: (text: string, image?: { mimeType: string; data: string }) => void;
  disabled: boolean;
  value?: string;
}

const ChatInput: React.FC<Props> = ({ onSend, disabled, value = '' }) => {
  const [text, setText] = useState(value);
  const [image, setImage] = useState<{ mimeType: string; data: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (value) setText(value);
  }, [value]);

  // Speech Recognition (Browser API)
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognitionRef.current.onerror = () => setIsRecording(false);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const handleSend = () => {
    if ((text.trim() || image) && !disabled) {
      onSend(text.trim(), image || undefined);
      setText('');
      setImage(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImage({
          mimeType: file.type,
          data: base64String
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  return (
    <div className="bg-white border-t border-gray-100 p-4 pb-6 fixed bottom-0 left-0 right-0 max-w-4xl mx-auto w-full z-40">
      <div className="flex flex-col gap-3">
        {image && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="relative group">
              <img src={`data:${image.mimeType};base64,${image.data}`} className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-lg ring-1 ring-gray-200" alt="Preview" />
              <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-black shadow-md transition-transform hover:scale-110">×</button>
            </div>
            <div className="text-xs text-gray-500 font-medium">Image attached</div>
          </div>
        )}
        
        <div className={`flex items-center gap-3 transition-all duration-300 rounded-[28px] px-4 py-2 border ${isFocused ? 'input-container-focus border-gray-300' : 'bg-[#f3f4f6] border-transparent'}`}>
          <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-gray-600 transition-all hover:bg-gray-200 rounded-full" title="Upload image of question"><Icons.Camera /></button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

          <input
            className="flex-1 bg-transparent border-none focus:outline-none text-gray-700 placeholder:text-gray-400 py-2 text-[15px]"
            placeholder="Ask your study question..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={disabled}
          />

          <button onClick={toggleRecording} className={`p-2 rounded-full transition-all flex items-center justify-center ${isRecording ? 'text-white bg-red-500 mic-active scale-110' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`} title={isRecording ? "Listening..." : "Speak your question"}><Icons.Mic /></button>
          <button onClick={handleSend} disabled={disabled || (!text.trim() && !image)} className={`p-2 rounded-full transition-all duration-300 ${disabled || (!text.trim() && !image) ? 'text-gray-300 opacity-50 cursor-not-allowed' : 'text-gray-800 bg-transparent hover:bg-gray-200 hover:scale-105 active:scale-95'}`}><Icons.Send /></button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;