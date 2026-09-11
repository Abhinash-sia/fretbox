export type HostelCategory = 'boys' | 'girls' | 'coed';
export type RoomStatus = 'available' | 'full' | 'maintenance' | 'inactive';
export type AllocationStatus = 'active' | 'vacated';

export interface Hostel {
  _id: string;
  name: string;
  code: string;
  category: HostelCategory;
  capacity?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HostelBlock {
  _id: string;
  hostelId: string | Hostel;
  name: string;
  code: string;
  floors?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  _id: string;
  blockId: string | HostelBlock;
  roomNumber: string;
  floorNumber: number;
  capacity: number;
  occupancy: number;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAllocation {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  roomId: {
    _id: string;
    roomNumber: string;
    floorNumber: number;
    blockId: {
      _id: string;
      name: string;
      code: string;
      hostelId: {
        _id: string;
        name: string;
        code: string;
      };
    };
  };
  allocatedByUserId: string;
  allocatedAt: string;
  vacatedAt?: string;
  vacatedByUserId?: string;
  status: AllocationStatus;
  remarks?: string;
}

export interface CreateHostelInput {
  name: string;
  code: string;
  category: HostelCategory;
  capacity?: number;
  description?: string;
}

export interface CreateBlockInput {
  hostelId: string;
  name: string;
  code: string;
  floors?: number;
  description?: string;
}

export interface CreateRoomInput {
  blockId: string;
  roomNumber: string;
  floorNumber: number;
  capacity: number;
}

export interface AllocateRoomInput {
  studentId: string;
  roomId: string;
  remarks?: string;
}

export interface VacateRoomInput {
  remarks?: string;
}
