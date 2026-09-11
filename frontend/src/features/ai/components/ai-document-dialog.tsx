'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FaqCategory, FaqDocument, CreateFaqDocumentInput } from '../types/ai';
import { useCreateFaqDocument, useUpdateFaqDocument } from '../hooks/use-faq-documents';

interface AiDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentToEdit?: FaqDocument | null;
}

const ALL_ROLES = ['student', 'faculty', 'warden', 'staff', 'security', 'administrator'];

function AiDocumentForm({
  documentToEdit,
  onClose,
}: {
  documentToEdit?: FaqDocument | null;
  onClose: () => void;
}) {
  const isEditing = !!documentToEdit;
  const createMutation = useCreateFaqDocument();
  const updateMutation = useUpdateFaqDocument();

  const [title, setTitle] = React.useState(documentToEdit?.title || '');
  const [category, setCategory] = React.useState<FaqCategory>(
    documentToEdit?.category || FaqCategory.GENERAL,
  );
  const [content, setContent] = React.useState(documentToEdit?.content || '');
  const [tagsString, setTagsString] = React.useState(
    documentToEdit?.tags?.join(', ') || '',
  );
  const [isApproved, setIsApproved] = React.useState(
    documentToEdit?.isApproved ?? true,
  );
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>(
    documentToEdit?.targetRoles || [],
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || title.length < 3) {
      setErrorMsg('Title must be at least 3 characters long.');
      return;
    }
    if (!content.trim() || content.length < 10) {
      setErrorMsg('Content must be at least 10 characters long.');
      return;
    }

    const tags = tagsString
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const payload: CreateFaqDocumentInput = {
      title: title.trim(),
      category,
      content: content.trim(),
      tags,
      isApproved,
      targetRoles: selectedRoles,
    };

    if (isEditing && documentToEdit) {
      updateMutation.mutate(
        { id: documentToEdit._id, data: payload },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (err) => {
            setErrorMsg(err.message || 'Failed to update document.');
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
        onError: (err) => {
          setErrorMsg(err.message || 'Failed to create document.');
        },
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
      {errorMsg && (
        <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
          {errorMsg}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1">
        <label className="font-semibold text-foreground">Document Title *</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Hostel Curfew & Late Entry Policy"
          required
        />
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label className="font-semibold text-foreground">Category *</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as FaqCategory)}
          className="w-full h-8 text-xs border border-input bg-background rounded-md px-2.5 focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
        >
          <option value={FaqCategory.GENERAL}>General</option>
          <option value={FaqCategory.HOSTEL}>Hostel</option>
          <option value={FaqCategory.ACADEMIC}>Academic</option>
          <option value={FaqCategory.FACILITIES}>Facilities</option>
          <option value={FaqCategory.MESS}>Mess</option>
          <option value={FaqCategory.GATE_PASS}>Gate Pass</option>
        </select>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <label className="font-semibold text-foreground">Knowledge Content *</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write the full authoritative campus rule or policy text..."
          rows={6}
          required
        />
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <label className="font-semibold text-foreground">Tags (comma separated)</label>
        <Input
          value={tagsString}
          onChange={(e) => setTagsString(e.target.value)}
          placeholder="curfew, timing, hostel, gate"
        />
      </div>

      {/* Target Roles */}
      <div className="space-y-1.5">
        <label className="font-semibold text-foreground">Target Audience Roles (Leave empty for ALL roles)</label>
        <div className="grid grid-cols-3 gap-2 p-2 rounded-md border border-border bg-muted/20">
          {ALL_ROLES.map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer capitalize">
              <input
                type="checkbox"
                checked={selectedRoles.includes(r)}
                onChange={() => toggleRole(r)}
                className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
              />
              <span>{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Is Approved Checkbox */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="isApproved"
          checked={isApproved}
          onChange={(e) => setIsApproved(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
        />
        <label htmlFor="isApproved" className="font-medium cursor-pointer">
          Approve for immediate AI RAG knowledge retrieval
        </label>
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : isEditing
            ? 'Save Changes'
            : 'Create Document'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AiDocumentDialog({
  open,
  onOpenChange,
  documentToEdit,
}: AiDocumentDialogProps) {
  const isEditing = !!documentToEdit;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {isEditing ? 'Edit Knowledge Base Document' : 'Create Knowledge Base Document'}
          </DialogTitle>
        </DialogHeader>

        {open && (
          <AiDocumentForm
            key={documentToEdit?._id || 'new-document'}
            documentToEdit={documentToEdit}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
