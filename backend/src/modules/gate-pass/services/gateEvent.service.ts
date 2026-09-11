import { GateEvent, IGateEventDocument } from '../models/gateEvent.model.js';
import { GateEventType, NotFoundError } from '../../../types/index.js';

export class GateEventService {
  public async getGateEvents(
    filterOptions: {
      studentId?: string;
      securityUserId?: string;
      gateId?: string;
      eventType?: GateEventType;
    },
    page = 1,
    limit = 20,
  ) {
    const filter: Record<string, unknown> = {};
    if (filterOptions.studentId) filter.studentId = filterOptions.studentId;
    if (filterOptions.securityUserId) filter.securityUserId = filterOptions.securityUserId;
    if (filterOptions.gateId) filter.gateId = filterOptions.gateId;
    if (filterOptions.eventType) filter.eventType = filterOptions.eventType;

    const skip = (page - 1) * limit;
    const [gateEvents, total] = await Promise.all([
      GateEvent.find(filter)
        .populate('gatePassId studentId securityUserId', 'passNumber name email role')
        .skip(skip)
        .limit(limit)
        .sort({ scannedAt: -1 }),
      GateEvent.countDocuments(filter),
    ]);

    return { gateEvents, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getGateEventById(id: string): Promise<IGateEventDocument> {
    const gateEvent = await GateEvent.findById(id).populate(
      'gatePassId studentId securityUserId',
      'passNumber name email role',
    );
    if (!gateEvent) {
      throw new NotFoundError('Gate event not found', 'GATE_EVENT_NOT_FOUND');
    }
    return gateEvent;
  }
}
