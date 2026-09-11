export enum FaqCategory {
  GENERAL = 'GENERAL',
  HOSTEL = 'HOSTEL',
  ACADEMIC = 'ACADEMIC',
  FACILITIES = 'FACILITIES',
  MESS = 'MESS',
  GATE_PASS = 'GATE_PASS',
}

export interface FaqQueryInput {
  question: string;
  category?: FaqCategory;
  limit?: number;
}

export interface FaqSource {
  id: string;
  title: string;
  category: string;
}

export interface FaqQueryResult {
  answer: string;
  confidence: number;
  isGrounded: boolean;
  sources: FaqSource[];
  provider: string;
  model: string;
}

export interface FaqDocument {
  _id: string;
  title: string;
  category: FaqCategory;
  content: string;
  tags: string[];
  isApproved: boolean;
  targetRoles: string[];
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFaqDocumentInput {
  title: string;
  category?: FaqCategory;
  content: string;
  tags?: string[];
  isApproved?: boolean;
  targetRoles?: string[];
}

export interface UpdateFaqDocumentInput {
  title?: string;
  category?: FaqCategory;
  content?: string;
  tags?: string[];
  isApproved?: boolean;
  targetRoles?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  queryResult?: FaqQueryResult;
  timestamp: string;
  error?: string;
}
