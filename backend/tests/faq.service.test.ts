import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FaqService } from '../src/modules/ai/faq/services/faq.service.js';
import { GeminiProvider } from '../src/modules/ai/complaint-classification/providers/gemini.provider.js';
import { FaqCategory, UserRole } from '../src/types/index.js';

describe('FaqService Unit Tests & Retrieval Grounding', () => {
  let mockProvider: GeminiProvider;
  let service: FaqService;

  beforeEach(() => {
    mockProvider = new GeminiProvider();
    service = new FaqService(mockProvider);
  });

  it('should return ungrounded response when no approved documents match the query', async () => {
    vi.spyOn(service, 'retrieveRelevantDocuments').mockResolvedValue([]);

    const result = await service.queryFaq('What is the secret formula?');

    expect(result.isGrounded).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.sources).toEqual([]);
    expect(result.answer).toContain('could not find any relevant approved campus information');
  });

  it('should use deterministic retrieval fallback when GEMINI_API_KEY is not configured', async () => {
    const mockFaqDoc = {
      _id: 'doc-101',
      title: 'Hostel Curfew Rules',
      category: FaqCategory.HOSTEL,
      content: 'Hostel gates close at 10 PM sharp.',
      tags: ['hostel', 'curfew'],
      isApproved: true,
      targetRoles: [UserRole.STUDENT],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as import('../src/types/index.js').IFaqDocument;
    vi.spyOn(service, 'retrieveRelevantDocuments').mockResolvedValue([mockFaqDoc]);
    vi.spyOn(mockProvider, 'isConfigured').mockReturnValue(false);

    const result = await service.queryFaq('When do hostel gates close?');

    expect(result.isGrounded).toBe(true);
    expect(result.provider).toBe('fallback-retrieval');
    expect(result.sources[0].title).toBe('Hostel Curfew Rules');
    expect(result.answer).toContain('Hostel gates close at 10 PM sharp.');
  });

  it('should generate grounded cited answer when Gemini API is configured and returns valid RAG output', async () => {
    vi.spyOn(service, 'retrieveRelevantDocuments').mockResolvedValue([
      {
        _id: 'doc-202',
        title: 'Attendance Policy',
        category: FaqCategory.ACADEMIC,
        content: 'Minimum 75% attendance is required for exams.',
        tags: ['attendance'],
        isApproved: true,
        targetRoles: [UserRole.STUDENT],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as import('../src/types/index.js').IFaqDocument,
    ]);
    vi.spyOn(mockProvider, 'isConfigured').mockReturnValue(true);
    vi.spyOn(mockProvider, 'answerFaqWithRag').mockResolvedValue({
      output: {
        answer: 'You need at least 75% attendance to take exams.',
        confidence: 0.95,
        sourcesUsed: ['Attendance Policy'],
        isGrounded: true,
      },
    });

    const result = await service.queryFaq('What is the minimum attendance required?');

    expect(result.isGrounded).toBe(true);
    expect(result.confidence).toBe(0.95);
    expect(result.answer).toBe('You need at least 75% attendance to take exams.');
    expect(result.sources[0].title).toBe('Attendance Policy');
  });
});
