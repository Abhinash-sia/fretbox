import { z } from 'zod';
import {
  HostelCategory,
  RoomStatus,
  AssetCategory,
  AssetStatus,
  AssetCondition,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  MealType,
} from '../types/index.js';

const mongoIdSchema = z
  .string({ required_error: 'ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

const optionalMongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format')
  .optional();

// --- Hostel Schemas ---
export const createHostelSchema = {
  body: z.object({
    name: z.string({ required_error: 'Hostel name is required' }).min(2),
    code: z.string({ required_error: 'Hostel code is required' }).min(2).max(10),
    category: z.nativeEnum(HostelCategory, { required_error: 'Category is required' }),
    capacity: z.number().int().nonnegative().optional(),
    description: z.string().optional(),
  }),
};

export const updateHostelSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(2).optional(),
    category: z.nativeEnum(HostelCategory).optional(),
    capacity: z.number().int().nonnegative().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
};

export const createBlockSchema = {
  body: z.object({
    hostelId: mongoIdSchema,
    name: z.string({ required_error: 'Block name is required' }).min(1),
    code: z.string({ required_error: 'Block code is required' }).min(1).max(10),
    floors: z.number().int().positive().optional(),
    description: z.string().optional(),
  }),
};

export const updateBlockSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(1).optional(),
    floors: z.number().int().positive().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
};

export const createRoomSchema = {
  body: z.object({
    blockId: mongoIdSchema,
    roomNumber: z.string({ required_error: 'Room number is required' }).min(1),
    floorNumber: z.number({ required_error: 'Floor number is required' }).int(),
    capacity: z.number({ required_error: 'Capacity is required' }).int().positive(),
  }),
};

export const updateRoomSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    capacity: z.number().int().positive().optional(),
    status: z.nativeEnum(RoomStatus).optional(),
    floorNumber: z.number().int().optional(),
  }),
};

export const allocateRoomSchema = {
  body: z.object({
    studentId: mongoIdSchema,
    roomId: mongoIdSchema,
    remarks: z.string().optional(),
  }),
};

export const vacateRoomSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    remarks: z.string().optional(),
  }),
};

// --- Facility Schemas ---
export const createAssetSchema = {
  body: z.object({
    name: z.string({ required_error: 'Asset name is required' }).min(2),
    assetTag: z.string({ required_error: 'Asset tag is required' }).min(2),
    category: z.nativeEnum(AssetCategory, { required_error: 'Asset category is required' }),
    status: z.nativeEnum(AssetStatus).optional(),
    condition: z.nativeEnum(AssetCondition).optional(),
    hostelId: optionalMongoIdSchema,
    blockId: optionalMongoIdSchema,
    roomId: optionalMongoIdSchema,
    locationText: z.string().optional(),
    purchaseDate: z.string().datetime().or(z.date()).optional(),
    warrantyExpiry: z.string().datetime().or(z.date()).optional(),
    lastMaintenanceDate: z.string().datetime().or(z.date()).optional(),
    nextMaintenanceDate: z.string().datetime().or(z.date()).optional(),
    notes: z.string().optional(),
  }),
};

export const updateAssetSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(2).optional(),
    category: z.nativeEnum(AssetCategory).optional(),
    status: z.nativeEnum(AssetStatus).optional(),
    condition: z.nativeEnum(AssetCondition).optional(),
    hostelId: optionalMongoIdSchema,
    blockId: optionalMongoIdSchema,
    roomId: optionalMongoIdSchema,
    locationText: z.string().optional(),
    lastMaintenanceDate: z.string().datetime().or(z.date()).optional(),
    nextMaintenanceDate: z.string().datetime().or(z.date()).optional(),
    notes: z.string().optional(),
  }),
};

// --- Complaint Schemas ---
export const createComplaintSchema = {
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3).max(200),
    description: z.string({ required_error: 'Description is required' }).min(5),
    category: z.nativeEnum(ComplaintCategory, { required_error: 'Category is required' }),
    priority: z.nativeEnum(ComplaintPriority).optional(),
    hostelId: optionalMongoIdSchema,
    blockId: optionalMongoIdSchema,
    roomId: optionalMongoIdSchema,
    assetId: optionalMongoIdSchema,
    preferredTimeSlot: z.string().optional(),
  }),
};

export const assignComplaintSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    assignedToStaffId: mongoIdSchema,
    notes: z.string().optional(),
  }),
};

export const updateComplaintStatusSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    status: z.nativeEnum(ComplaintStatus, { required_error: 'Status is required' }),
    notes: z.string().optional(),
    resolutionNotes: z.string().optional(),
  }),
};

// --- Mess Schemas ---
export const createMessMenuSchema = {
  body: z.object({
    hostelId: optionalMongoIdSchema,
    date: z.string({ required_error: 'Date is required' }),
    mealType: z.nativeEnum(MealType, { required_error: 'Meal type is required' }),
    items: z.array(z.string()).min(1, 'At least one item is required'),
    description: z.string().optional(),
    isPublished: z.boolean().optional(),
  }),
};

export const updateMessMenuSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    items: z.array(z.string()).min(1).optional(),
    description: z.string().optional(),
    isPublished: z.boolean().optional(),
  }),
};

export const submitMessFeedbackSchema = {
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    rating: z.number({ required_error: 'Rating is required' }).int().min(1).max(5),
    comments: z.string().max(1000).optional(),
  }),
};
