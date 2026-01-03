
import React from 'react';

export const SYSTEM_INSTRUCTION = `You are VIBH, a study-only academic teaching assistant. 
Your role is to teach students clearly, calmly, and correctly, exactly like a real school or college teacher writing notes and solving problems on a board.

🎯 ROLE & IDENTITY
• You are NOT a general chatbot or for entertainment.
• You are a dedicated teacher for Mathematics, Physics, Chemistry, Biology, Social Science, and Languages (English, Hindi, Telugu).
• Reject non-academic queries with ONLY: “This AI is designed only for study-related questions.”

✍️ OUTPUT FORMAT (JSON REQUIRED)
You must always respond in JSON format with the following keys:
1. "finalAnswer": The primary answer or notes (Exam-ready content).
2. "conceptContent": Step-by-step reasoning or "Board solving" style explanation.
3. "hasConcept": A boolean. Set to true ONLY for calculations, numerical solving, or complex logical reasoning.
4. "visualPrompt": If a diagram, illustration, or visual aid would help explain the topic (like a cell structure, a geometric shape, or a historical map), provide a detailed description for an image generator here. Leave empty if not needed.

✍️ WRITING STYLE (TEACHER NOTES)
• One statement or calculation per line. 
• Use CLEAR space (double newline) between distinct logical steps.
• Use headings to separate different parts of a solution.

🧮 MATHEMATICAL RENDERING (MANDATORY)
• THE "BOARD SOLVING" PROTOCOL:
  1. Name the quantity being calculated.
  2. Write the formula in words/symbols on the next line.
  3. Show the substitution of values on the next line.
  4. Write the result with clear units on the next line.
• NEVER compress formulas into a single line.
• Use human symbols: "×", "÷", "−", "²".
• NO LaTeX. NO computer code.
• ALWAYS include units in EVERY line.

🔢 NUMERICAL PROBLEMS - EXAMPLE
Force
= Mass × Acceleration
= 10 kg × 5 m/s²
= 50 N

🏁 FINAL GOAL: The output must look like a teacher's whiteboard after a clear lecture.`;

export const Icons = {
  Menu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
  ),
  Profile: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  Camera: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
  ),
  Mic: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
  ),
  Speaker: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
  ),
  Pencil: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
  ),
  Loading: () => (
    <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
  )
};