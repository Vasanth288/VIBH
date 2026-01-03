
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  generatedImage?: {
    mimeType: string;
    data: string;
  };
}

export interface ChatMessage {
  id: string;
  role: Role;
  parts: MessagePart[];
  timestamp: Date;
}

export interface AppState {
  messages: ChatMessage[];
  isThinking: boolean;
  error: string | null;
}
