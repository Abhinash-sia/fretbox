import { Hostel, IHostelDocument } from '../models/hostel.model.js';
import { HostelBlock, IHostelBlockDocument } from '../models/hostelBlock.model.js';
import { Room, IRoomDocument } from '../models/room.model.js';
import {
  StudentRoomAllocation,
  IStudentRoomAllocationDocument,
} from '../models/studentRoomAllocation.model.js';
import { User } from '../models/user.model.js';
import {
  HostelCategory,
  RoomStatus,
  AllocationStatus,
  UserRole,
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../types/index.js';

export class HostelService {
  // --- Hostel CRUD ---
  public async createHostel(data: {
    name: string;
    code: string;
    category: HostelCategory;
    capacity?: number;
    description?: string;
  }): Promise<IHostelDocument> {
    const code = data.code.trim().toUpperCase();
    const existing = await Hostel.findOne({ code });
    if (existing) {
      throw new ConflictError(`Hostel with code '${code}' already exists`, 'HOSTEL_DUPLICATE');
    }
    return Hostel.create({
      name: data.name.trim(),
      code,
      category: data.category,
      capacity: data.capacity || 0,
      description: data.description?.trim(),
    });
  }

  public async getHostels(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [hostels, total] = await Promise.all([
      Hostel.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      Hostel.countDocuments(),
    ]);
    return { hostels, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getHostelById(id: string): Promise<IHostelDocument> {
    const hostel = await Hostel.findById(id);
    if (!hostel) {
      throw new NotFoundError('Hostel not found', 'HOSTEL_NOT_FOUND');
    }
    return hostel;
  }

  public async updateHostel(
    id: string,
    data: {
      name?: string;
      category?: HostelCategory;
      capacity?: number;
      description?: string;
      isActive?: boolean;
    },
  ): Promise<IHostelDocument> {
    const hostel = await this.getHostelById(id);
    if (data.name !== undefined) hostel.name = data.name.trim();
    if (data.category !== undefined) hostel.category = data.category;
    if (data.capacity !== undefined) hostel.capacity = data.capacity;
    if (data.description !== undefined) hostel.description = data.description.trim();
    if (data.isActive !== undefined) hostel.isActive = data.isActive;
    return hostel.save();
  }

  // --- Hostel Block CRUD ---
  public async createBlock(data: {
    hostelId: string;
    name: string;
    code: string;
    floors?: number;
    description?: string;
  }): Promise<IHostelBlockDocument> {
    await this.getHostelById(data.hostelId);
    const code = data.code.trim().toUpperCase();
    const existing = await HostelBlock.findOne({ hostelId: data.hostelId, code });
    if (existing) {
      throw new ConflictError(
        `Block code '${code}' already exists in this hostel`,
        'BLOCK_DUPLICATE',
      );
    }
    return HostelBlock.create({
      hostelId: data.hostelId,
      name: data.name.trim(),
      code,
      floors: data.floors || 1,
      description: data.description?.trim(),
    });
  }

  public async getBlocksByHostel(hostelId: string) {
    await this.getHostelById(hostelId);
    return HostelBlock.find({ hostelId }).sort({ code: 1 });
  }

  public async getBlockById(id: string): Promise<IHostelBlockDocument> {
    const block = await HostelBlock.findById(id);
    if (!block) {
      throw new NotFoundError('Hostel block not found', 'HOSTEL_BLOCK_NOT_FOUND');
    }
    return block;
  }

  public async updateBlock(
    id: string,
    data: { name?: string; floors?: number; description?: string; isActive?: boolean },
  ): Promise<IHostelBlockDocument> {
    const block = await this.getBlockById(id);
    if (data.name !== undefined) block.name = data.name.trim();
    if (data.floors !== undefined) block.floors = data.floors;
    if (data.description !== undefined) block.description = data.description.trim();
    if (data.isActive !== undefined) block.isActive = data.isActive;
    return block.save();
  }

  // --- Room CRUD ---
  public async createRoom(data: {
    blockId: string;
    roomNumber: string;
    floorNumber: number;
    capacity: number;
  }): Promise<IRoomDocument> {
    const block = await this.getBlockById(data.blockId);
    const roomNumber = data.roomNumber.trim();
    const existing = await Room.findOne({ blockId: data.blockId, roomNumber });
    if (existing) {
      throw new ConflictError(
        `Room '${roomNumber}' already exists in this block`,
        'ROOM_DUPLICATE',
      );
    }
    return Room.create({
      hostelId: block.hostelId,
      hostelBlockId: block._id,
      blockId: data.blockId,
      roomNumber,
      floor: data.floorNumber,
      floorNumber: data.floorNumber,
      capacity: data.capacity,
      occupiedCount: 0,
      status: RoomStatus.AVAILABLE,
    });
  }

  public async getRooms(
    blockId?: string,
    hostelId?: string,
    status?: RoomStatus,
    page = 1,
    limit = 50,
  ) {
    const filter: Record<string, unknown> = {};
    if (blockId) filter.blockId = blockId;
    if (hostelId) filter.hostelId = hostelId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [rooms, total] = await Promise.all([
      Room.find(filter)
        .populate('hostelId blockId')
        .skip(skip)
        .limit(limit)
        .sort({ roomNumber: 1 }),
      Room.countDocuments(filter),
    ]);
    return { rooms, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  public async getRoomById(id: string): Promise<IRoomDocument> {
    const room = await Room.findById(id).populate('hostelId blockId');
    if (!room) {
      throw new NotFoundError('Room not found', 'ROOM_NOT_FOUND');
    }
    return room;
  }

  public async updateRoom(
    id: string,
    data: { capacity?: number; status?: RoomStatus; floorNumber?: number },
  ): Promise<IRoomDocument> {
    const room = await Room.findById(id);
    if (!room) {
      throw new NotFoundError('Room not found', 'ROOM_NOT_FOUND');
    }

    if (data.capacity !== undefined) {
      if (data.capacity < room.occupiedCount) {
        throw new BadRequestError(
          `Cannot reduce capacity to ${data.capacity} as ${room.occupiedCount} beds are currently occupied`,
        );
      }
      room.capacity = data.capacity;
    }

    if (data.floorNumber !== undefined) room.floorNumber = data.floorNumber;

    if (data.status !== undefined) {
      room.status = data.status;
    } else {
      // Re-evaluate auto status
      if (room.occupiedCount >= room.capacity) {
        room.status = RoomStatus.FULL;
      } else if (room.status === RoomStatus.FULL && room.occupiedCount < room.capacity) {
        room.status = RoomStatus.AVAILABLE;
      }
    }

    return room.save();
  }

  // --- Room Allocation ---
  public async allocateRoom(data: {
    studentId: string;
    roomId: string;
    allocatedByUserId: string;
    remarks?: string;
  }): Promise<IStudentRoomAllocationDocument> {
    const student = await User.findById(data.studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      throw new BadRequestError('Target user must exist and have STUDENT role');
    }

    const activeAllocation = await StudentRoomAllocation.findOne({
      studentId: data.studentId,
      status: AllocationStatus.ACTIVE,
    });
    if (activeAllocation) {
      throw new ConflictError(
        'Student already has an active room allocation',
        'ALLOCATION_EXISTS',
      );
    }

    const room = await Room.findById(data.roomId);
    if (!room) {
      throw new NotFoundError('Room not found', 'ROOM_NOT_FOUND');
    }

    if (room.status === RoomStatus.MAINTENANCE || room.status === RoomStatus.INACTIVE) {
      throw new BadRequestError(`Cannot allocate room in status '${room.status}'`);
    }

    if (room.occupiedCount >= room.capacity) {
      throw new BadRequestError('Room capacity is full');
    }

    // Allocate
    const allocation = await StudentRoomAllocation.create({
      studentId: data.studentId,
      hostelId: room.hostelId,
      blockId: room.blockId,
      roomId: room._id,
      allocatedByUserId: data.allocatedByUserId,
      allocatedAt: new Date(),
      status: AllocationStatus.ACTIVE,
      remarks: data.remarks?.trim(),
    });

    // Update room occupancy
    room.occupiedCount += 1;
    if (room.occupiedCount >= room.capacity) {
      room.status = RoomStatus.FULL;
    }
    await room.save();

    return allocation;
  }

  public async vacateRoom(
    allocationId: string,
    _vacatedByUserId: string,
    remarks?: string,
  ): Promise<IStudentRoomAllocationDocument> {
    const allocation = await StudentRoomAllocation.findById(allocationId);
    if (!allocation) {
      throw new NotFoundError('Allocation record not found', 'ALLOCATION_NOT_FOUND');
    }

    if (allocation.status === AllocationStatus.VACATED) {
      throw new BadRequestError('Room allocation is already vacated');
    }

    allocation.status = AllocationStatus.VACATED;
    allocation.vacatedAt = new Date();
    if (remarks) {
      allocation.remarks = allocation.remarks
        ? `${allocation.remarks} | Vacated: ${remarks}`
        : `Vacated: ${remarks}`;
    }
    await allocation.save();

    const room = await Room.findById(allocation.roomId);
    if (room) {
      room.occupiedCount = Math.max(0, room.occupiedCount - 1);
      if (room.status === RoomStatus.FULL && room.occupiedCount < room.capacity) {
        room.status = RoomStatus.AVAILABLE;
      }
      await room.save();
    }

    return allocation;
  }

  public async getStudentAllocation(
    studentId: string,
  ): Promise<IStudentRoomAllocationDocument | null> {
    return StudentRoomAllocation.findOne({
      studentId,
      status: AllocationStatus.ACTIVE,
    }).populate('hostelId blockId roomId studentId');
  }

  public async getAllocations(
    filterOptions: {
      studentId?: string;
      hostelId?: string;
      blockId?: string;
      roomId?: string;
      status?: AllocationStatus;
    },
    page = 1,
    limit = 20,
  ) {
    const filter: Record<string, unknown> = {};
    if (filterOptions.studentId) filter.studentId = filterOptions.studentId;
    if (filterOptions.hostelId) filter.hostelId = filterOptions.hostelId;
    if (filterOptions.blockId) filter.blockId = filterOptions.blockId;
    if (filterOptions.roomId) filter.roomId = filterOptions.roomId;
    if (filterOptions.status) filter.status = filterOptions.status;

    const skip = (page - 1) * limit;
    const [allocations, total] = await Promise.all([
      StudentRoomAllocation.find(filter)
        .populate('studentId hostelId blockId roomId')
        .skip(skip)
        .limit(limit)
        .sort({ allocatedAt: -1 }),
      StudentRoomAllocation.countDocuments(filter),
    ]);

    return { allocations, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
