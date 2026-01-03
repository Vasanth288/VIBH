
import React, { useState, useRef, useEffect } from 'react';
import { Role, ChatMessage as ChatMessageType } from '../types';
import { Icons } from '../constants';
import { generateSpeech } from '../services/geminiService';

interface Props {
  message: ChatMessageType;
  isSelectionMode?: boolean;
  onTextSelected?: (text: string) => void;
}

const ChatMessage: React.FC<Props> = ({ message, isSelectionMode, onTextSelected }) => {
  const isUser = message.role === Role.USER;
  const [showConcept, setShowConcept] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const strokeRef = useRef<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);

  // --- Audio Logic ---
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const handleListen = async (text: string) => {
    if (isPlaying) {
      audioSourceRef.current?.stop();
      setIsPlaying(false);
      return;
    }
    setIsAudioLoading(true);
    try {
      const base64Audio = await generateSpeech(text);
      if (!base64Audio) throw new Error("Failed to generate speech");
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      audioSourceRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (error) {
      console.error("Audio playback error:", error);
    } finally {
      setIsAudioLoading(false);
    }
  };

  // --- Drawing / Selection Logic ---
  useEffect(() => {
    if (isSelectionMode && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#ef4444'; 
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.8;
      }
    }
  }, [isSelectionMode, message]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSelectionMode) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    strokeRef.current = { minX: x, minY: y, maxX: x, maxY: y };
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isSelectionMode) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !strokeRef.current) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    strokeRef.current.minX = Math.min(strokeRef.current.minX, x);
    strokeRef.current.minY = Math.min(strokeRef.current.minY, y);
    strokeRef.current.maxX = Math.max(strokeRef.current.maxX, x);
    strokeRef.current.maxY = Math.max(strokeRef.current.maxY, y);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing || !isSelectionMode) return;
    setIsDrawing(false);
    
    if (containerRef.current && onTextSelected && strokeRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const bounds = {
        left: strokeRef.current.minX + rect.left,
        top: strokeRef.current.minY + rect.top,
        right: strokeRef.current.maxX + rect.left,
        bottom: strokeRef.current.maxY + rect.top
      };

      if (bounds.right - bounds.left < 5 && bounds.bottom - bounds.top < 5) {
        return;
      }

      // Detection with slight padding to capture text better
      const elements = containerRef.current.querySelectorAll('.notebook-line, .math-line, .heading-line');
      let foundText: string[] = [];
      
      elements.forEach(el => {
        const elRect = el.getBoundingClientRect();
        // Check for meaningful overlap (at least 20% of element inside bounds or simple intersection)
        const isOverlap = !(
          elRect.right < bounds.left || 
          elRect.left > bounds.right || 
          elRect.bottom < bounds.top || 
          elRect.top > bounds.bottom
        );

        if (isOverlap) {
          const content = el.textContent?.trim();
          if (content) {
            foundText.push(content);
            // Visual feedback: highlight selected element briefly
            (el as HTMLElement).style.transition = 'background-color 0.3s ease';
            (el as HTMLElement).style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            setTimeout(() => {
                (el as HTMLElement).style.backgroundColor = 'transparent';
            }, 800);
          }
        }
      });

      if (foundText.length > 0) {
        onTextSelected(foundText.join(' '));
      }
    }
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokeRef.current = null;
  };

  const renderLines = (text: string, isConcept: boolean = false) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (trimmed === '') return <div key={i} className="h-6" />;
      let className = "notebook-line mb-1";
      if (trimmed.startsWith('=') || trimmed.includes('×') || trimmed.includes('÷')) className = "math-line";
      else if (trimmed.length < 40 && !trimmed.endsWith('.') && !trimmed.endsWith(',') && !trimmed.startsWith('•')) className = "heading-line";
      else if (trimmed.startsWith('•')) className = "pl-4 mb-2";
      return (
        <div key={i} className={`${className} ${isConcept ? 'text-gray-700' : ''}`}>
          {line}
        </div>
      );
    });
  };

  const renderPartContent = (text: string) => {
    if (isUser) return renderLines(text);
    try {
      const data = JSON.parse(text);
      return (
        <div className="flex flex-col">
          <div className="relative">
            <div className="pr-24">{renderLines(data.finalAnswer)}</div>
            <div className="absolute top-1 right-0 flex flex-col gap-2 items-end">
              <button
                onClick={() => handleListen(data.finalAnswer)}
                disabled={isAudioLoading}
                className={`p-2 rounded-full transition-all duration-300 border shadow-sm flex items-center justify-center ${isPlaying ? 'bg-red-50 text-red-500 border-red-100' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600'}`}
                title="Listen to the answer"
              ><Icons.Speaker /></button>
              {data.hasConcept && (
                <button
                  onClick={() => setShowConcept(!showConcept)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border shadow-sm ${showConcept ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300 hover:text-gray-600'}`}
                >{showConcept ? "− Hide Logic" : "+ See Logic"}</button>
              )}
            </div>
          </div>
          {showConcept && data.hasConcept && (
            <div className="mt-10 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[2px] flex-1 bg-gray-100"></div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Step-by-Step Board Work</span>
                   <button onClick={() => handleListen(data.conceptContent)} className="p-1 text-gray-300 hover:text-gray-500 transition-colors" title="Listen to the concept"><Icons.Speaker /></button>
                </div>
                <div className="h-[2px] flex-1 bg-gray-100"></div>
              </div>
              <div className="concept-board border-l-8 border-gray-100 bg-[#fbfbfb] pl-10 pr-6 py-6 rounded-r-3xl shadow-sm overflow-hidden">
                <div className="mb-6 flex items-center gap-3">
                  <div className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider">Process</div>
                  <div className="h-[1px] flex-1 bg-gray-100"></div>
                </div>
                <div className="text-[16px] text-gray-700 leading-relaxed">{renderLines(data.conceptContent, true)}</div>
              </div>
            </div>
          )}
        </div>
      );
    } catch (e) {
      return (
        <div className="relative">
          <div className="pr-12">{renderLines(text)}</div>
          {!isUser && (
             <button onClick={() => handleListen(text)} disabled={isAudioLoading} className="absolute top-0 right-0 p-2 text-gray-300 hover:text-gray-500">
              {isAudioLoading ? <Icons.Loading /> : <Icons.Speaker />}
            </button>
          )}
        </div>
      );
    }
  };

  return (
    <div className={`flex w-full mb-16 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        ref={containerRef}
        className={`relative transition-all duration-300 ${
          isUser 
            ? 'max-w-[80%] bg-[#f0f9ff] text-blue-900 rounded-2xl p-6 shadow-sm border border-blue-100' 
            : 'w-full text-gray-800 px-0 py-4 font-normal text-[16px]'
        }`}
      >
        {isSelectionMode && !isUser && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-30 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
          />
        )}

        {message.parts.map((part, idx) => (
          <div key={idx} className="flex flex-col gap-8">
            {part.inlineData && (
              <div className="relative self-start max-w-full">
                <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`} alt="Student's Reference" className={`max-h-[500px] rounded-3xl object-contain bg-white border-4 border-white shadow-xl ${isUser ? 'mb-2' : 'mb-10'}`} />
                {!isUser && <div className="absolute -top-4 -left-4 bg-white px-3 py-1 rounded-full shadow-md text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-50">Input Source</div>}
              </div>
            )}
            {part.generatedImage && (
              <div className="flex flex-col gap-2 mt-4 self-center w-full max-w-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="px-2 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-bold rounded uppercase tracking-widest border border-indigo-100">Visual Aid</div>
                  <div className="h-[1px] flex-1 bg-gray-100"></div>
                </div>
                <img src={`data:${part.generatedImage.mimeType};base64,${part.generatedImage.data}`} alt="Educational Visual" className="w-full rounded-2xl shadow-lg border border-gray-100 bg-white" />
              </div>
            )}
            {part.text && (
              <div className={isUser ? "leading-relaxed" : "teacher-notes font-sans"}>
                {renderPartContent(part.text)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatMessage;
