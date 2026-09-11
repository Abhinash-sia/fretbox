'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Box } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAsset, useUpdateAsset } from '../hooks/use-facilities-queries';
import { FacilityAsset } from '../types/facilities';

const assetSchema = z.object({
  name: z.string({ message: 'Asset name is required' }).min(2),
  assetTag: z.string({ message: 'Asset tag is required' }).min(2),
  category: z.enum([
    'electrical',
    'plumbing',
    'cleanliness',
    'room',
    'furniture',
    'network',
    'water',
    'appliance',
    'safety',
    'other',
  ]),
  status: z.enum(['active', 'maintenance', 'damaged', 'retired']),
  condition: z.enum(['good', 'fair', 'poor', 'critical']),
  locationText: z.string().optional(),
  notes: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface CreateAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetToEdit?: FacilityAsset | null;
}

export function CreateAssetModal({
  open,
  onOpenChange,
  assetToEdit,
}: CreateAssetModalProps) {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();

  const isEditing = !!assetToEdit;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: assetToEdit?.name || '',
      assetTag: assetToEdit?.assetTag || '',
      category: assetToEdit?.category || 'electrical',
      status: assetToEdit?.status || 'active',
      condition: assetToEdit?.condition || 'good',
      locationText: assetToEdit?.locationText || '',
      notes: assetToEdit?.notes || '',
    },
  });

  const onSubmit = async (data: AssetFormValues) => {
    setServerError(null);
    try {
      if (isEditing && assetToEdit) {
        await updateAssetMutation.mutateAsync({
          id: assetToEdit._id,
          input: data,
        });
      } else {
        await createAssetMutation.mutateAsync(data);
      }
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Failed to save facility asset');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Box className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {isEditing ? 'Edit Facility Asset' : 'Register New Facility Asset'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Maintain facility inventory & operational health
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-2 text-xs">
          {serverError && (
            <div className="rounded bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Asset Name</label>
              <Input {...register('name')} placeholder="e.g. Split Air Conditioner" />
              {errors.name && <p className="text-[11px] text-rose-600">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Asset Tag</label>
              <Input {...register('assetTag')} placeholder="e.g. AC-BLK-A-101" className="font-mono" />
              {errors.assetTag && <p className="text-[11px] text-rose-600">{errors.assetTag.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Category</label>
              <select
                {...register('category')}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="room">Room</option>
                <option value="furniture">Furniture</option>
                <option value="network">Network</option>
                <option value="water">Water</option>
                <option value="appliance">Appliance</option>
                <option value="safety">Safety</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Status</label>
              <select
                {...register('status')}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="damaged">Damaged</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Condition</label>
              <select
                {...register('condition')}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Location Text</label>
            <Input {...register('locationText')} placeholder="e.g. Boys Hostel Block A - Room 101" />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Notes / Maintenance Log</label>
            <Textarea {...register('notes')} placeholder="Asset notes, warranty info, or specs..." rows={2} />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="emerald"
              size="sm"
              disabled={createAssetMutation.isPending || updateAssetMutation.isPending}
            >
              {createAssetMutation.isPending || updateAssetMutation.isPending
                ? 'Saving...'
                : isEditing
                ? 'Update Asset'
                : 'Register Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
