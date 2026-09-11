import { Types } from 'mongoose';
import { FaqDocument, IFaqDocumentModel } from '../models/faqDocument.model.js';
import { GeminiProvider } from './ai/gemini.provider.js';
import { FaqCategory, UserRole, NotFoundError } from '../types/index.js';

export interface FaqQueryResult {
  answer: string;
  confidence: number;
  isGrounded: boolean;
  sources: Array<{ id: string; title: string; category: string }>;
  provider: string;
  model: string;
}

export class FaqService {
  private geminiProvider: GeminiProvider;

  constructor(provider?: GeminiProvider) {
    this.geminiProvider = provider || new GeminiProvider();
  }

  /**
   * Retrieve relevant approved FAQ documents from MongoDB based on keywords/category/role.
   */
  public async retrieveRelevantDocuments(
    question: string,
    category?: FaqCategory,
    userRole?: UserRole,
    limit = 5,
  ): Promise<IFaqDocumentModel[]> {
    const filter: Record<string, unknown> = { isApproved: true };

    if (category) {
      filter.category = category;
    }

    if (userRole && userRole !== UserRole.ADMINISTRATOR) {
      filter.$or = [{ targetRoles: { $size: 0 } }, { targetRoles: userRole }];
    }

    // Try text search index first if question contains search terms
    const cleanQuery = question.replace(/[^\w\s]/gi, '').trim();
    if (cleanQuery.length > 0) {
      try {
        const textResults = await FaqDocument.find(
          { ...filter, $text: { $search: cleanQuery } },
          { score: { $meta: 'textScore' } },
        )
          .sort({ score: { $meta: 'textScore' } })
          .limit(limit);

        if (textResults.length > 0) {
          return textResults;
        }
      } catch {
        // Fallback to regex or tag matching if text index score search fails
      }
    }

    // Keyword fallback search using regex over title & tags
    const words = cleanQuery
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5);

    if (words.length > 0) {
      const regexPatterns = words.map((w) => new RegExp(w, 'i'));
      const keywordConditions = [
        { title: { $in: regexPatterns } },
        { content: { $in: regexPatterns } },
        { tags: { $in: words.map((w) => w.toLowerCase()) } },
      ];

      const fallbackConditions: Array<Record<string, unknown>> = [{ isApproved: true }];
      if (category) fallbackConditions.push({ category });
      if (userRole && userRole !== UserRole.ADMINISTRATOR) {
        fallbackConditions.push({
          $or: [{ targetRoles: { $size: 0 } }, { targetRoles: userRole }],
        });
      }

      const regexResults = await FaqDocument.find({
        $and: [...fallbackConditions, { $or: keywordConditions }],
      }).limit(limit);

      if (regexResults.length > 0) {
        return regexResults;
      }
    }

    // General fallback: return top approved documents for category or recent docs
    return FaqDocument.find(filter).sort({ createdAt: -1 }).limit(limit);
  }

  /**
   * Query FAQ assistant using RAG pipeline:
   * 1. Retrieve knowledge documents
   * 2. If no docs found or AI disabled -> Return deterministic fallback
   * 3. Send context to Gemini
   * 4. Return structured cited answer
   */
  public async queryFaq(
    question: string,
    category?: FaqCategory,
    userRole?: UserRole,
    limit = 5,
  ): Promise<FaqQueryResult> {
    const docs = await this.retrieveRelevantDocuments(question, category, userRole, limit);
    const providerName = 'google-gemini';
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (docs.length === 0) {
      return {
        answer:
          'I am sorry, but I could not find any relevant approved campus information to answer your question.',
        confidence: 0,
        isGrounded: false,
        sources: [],
        provider: providerName,
        model: modelName,
      };
    }

    const sources = docs.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      category: doc.category,
    }));

    const topDoc = docs[0];
    if (!topDoc) {
      return {
        answer:
          'I could not find specific campus knowledge documents answering your question. Please contact campus administration.',
        confidence: 0.0,
        isGrounded: false,
        sources: [],
        provider: providerName,
        model: modelName,
      };
    }

    if (!this.geminiProvider.isConfigured()) {
      // Deterministic RAG fallback without Gemini key
      return {
        answer: `[Campus Knowledge Base Response]\n\nBased on "${topDoc.title}":\n${topDoc.content}`,
        confidence: 0.75,
        isGrounded: true,
        sources: sources.slice(0, 1),
        provider: 'fallback-retrieval',
        model: modelName,
      };
    }

    const contextDocuments = docs.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content,
    }));

    try {
      const ragResult = await this.geminiProvider.answerFaqWithRag(question, contextDocuments);

      const output = ragResult.output;
      if (ragResult.error || !output) {
        return {
          answer: `Based on campus records for "${topDoc.title}": ${topDoc.content.substring(0, 300)}...`,
          confidence: 0.6,
          isGrounded: true,
          sources: sources.slice(0, 1),
          provider: providerName,
          model: modelName,
        };
      }

      return {
        answer: output.answer,
        confidence: output.confidence,
        isGrounded: output.isGrounded,
        sources: output.sourcesUsed
          ? sources.filter((s) => output.sourcesUsed.includes(s.title))
          : sources.slice(0, 1),
        provider: providerName,
        model: modelName,
      };
    } catch {
      return {
        answer: `Based on campus records for "${topDoc.title}": ${topDoc.content.substring(0, 300)}...`,
        confidence: 0.6,
        isGrounded: true,
        sources: sources.slice(0, 1),
        provider: providerName,
        model: modelName,
      };
    }
  }

  // --- Knowledge Document CRUD Methods ---

  public async getFaqDocuments(
    category?: FaqCategory,
    userRole?: UserRole,
  ): Promise<IFaqDocumentModel[]> {
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (userRole && userRole !== UserRole.ADMINISTRATOR) {
      filter.isApproved = true;
      filter.$or = [{ targetRoles: { $size: 0 } }, { targetRoles: userRole }];
    }
    return FaqDocument.find(filter).sort({ createdAt: -1 });
  }

  public async createFaqDocument(data: {
    title: string;
    category?: FaqCategory;
    content: string;
    tags?: string[];
    isApproved?: boolean;
    targetRoles?: UserRole[];
    createdById?: string;
  }): Promise<IFaqDocumentModel> {
    return FaqDocument.create({
      title: data.title.trim(),
      category: data.category || FaqCategory.GENERAL,
      content: data.content.trim(),
      tags: data.tags || [],
      isApproved: data.isApproved !== undefined ? data.isApproved : true,
      targetRoles: data.targetRoles || [],
      createdById: data.createdById ? new Types.ObjectId(data.createdById) : undefined,
    });
  }

  public async updateFaqDocument(
    id: string,
    data: {
      title?: string;
      category?: FaqCategory;
      content?: string;
      tags?: string[];
      isApproved?: boolean;
      targetRoles?: UserRole[];
    },
  ): Promise<IFaqDocumentModel> {
    const doc = await FaqDocument.findById(id);
    if (!doc) {
      throw new NotFoundError('FAQ document not found', 'FAQ_NOT_FOUND');
    }

    if (data.title !== undefined) doc.title = data.title.trim();
    if (data.category !== undefined) doc.category = data.category;
    if (data.content !== undefined) doc.content = data.content.trim();
    if (data.tags !== undefined) doc.tags = data.tags;
    if (data.isApproved !== undefined) doc.isApproved = data.isApproved;
    if (data.targetRoles !== undefined) doc.targetRoles = data.targetRoles;

    await doc.save();
    return doc;
  }

  public async deleteFaqDocument(id: string): Promise<void> {
    const res = await FaqDocument.deleteOne({ _id: id });
    if (res.deletedCount === 0) {
      throw new NotFoundError('FAQ document not found', 'FAQ_NOT_FOUND');
    }
  }
}
