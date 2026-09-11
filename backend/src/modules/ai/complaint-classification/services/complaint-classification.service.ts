import { GeminiProvider } from '../providers/gemini.provider.js';
import {
  AiClassificationStatus,
  ComplaintCategory,
  ComplaintPriority,
  IAiClassification,
} from '../../../../types/index.js';
import { getEnv } from '../../../../config/env.js';

export interface ComplaintClassifier {
  classify(input: { title: string; description: string }): Promise<IAiClassification>;
}

export class ComplaintClassificationService implements ComplaintClassifier {
  private geminiProvider: GeminiProvider;

  constructor(provider?: GeminiProvider) {
    this.geminiProvider = provider || new GeminiProvider();
  }

  public async classify(input: { title: string; description: string }): Promise<IAiClassification> {
    const env = getEnv();
    const threshold = env.AI_COMPLAINT_CONFIDENCE_THRESHOLD ?? 0.8;
    const providerName = 'google-gemini';
    const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!this.geminiProvider.isConfigured()) {
      return {
        category: ComplaintCategory.OTHER,
        priority: ComplaintPriority.MEDIUM,
        confidence: 0,
        reason: 'AI classification unavailable (GEMINI_API_KEY missing). Human review required.',
        provider: providerName,
        model: modelName,
        status: AiClassificationStatus.UNAVAILABLE,
        classifiedAt: new Date(),
      };
    }

    const result = await this.geminiProvider.classifyComplaint(input);

    if (result.error || !result.output) {
      return {
        category: ComplaintCategory.OTHER,
        priority: ComplaintPriority.MEDIUM,
        confidence: 0,
        reason: `AI classification failed: ${result.error || 'Unknown error'}. Human review required.`,
        provider: providerName,
        model: modelName,
        status: AiClassificationStatus.FAILED,
        classifiedAt: new Date(),
      };
    }

    const { category, priority, confidence, reason } = result.output;
    const isHighConfidence = confidence >= threshold;

    return {
      category,
      priority,
      confidence,
      reason,
      provider: providerName,
      model: modelName,
      status: isHighConfidence
        ? AiClassificationStatus.CLASSIFIED
        : AiClassificationStatus.NEEDS_REVIEW,
      classifiedAt: new Date(),
    };
  }
}
