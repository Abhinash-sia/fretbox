'use client';

import * as React from 'react';
import { Plus, Search, Filter, Edit, Trash2, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FaqCategory, FaqDocument } from '../types/ai';
import { useFaqDocuments, useDeleteFaqDocument } from '../hooks/use-faq-documents';
import { AiDocumentDialog } from './ai-document-dialog';

export function AiKnowledgeTable() {
  const [selectedCategory, setSelectedCategory] = React.useState<FaqCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [documentToEdit, setDocumentToEdit] = React.useState<FaqDocument | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const { data: documents = [], isLoading, isError, refetch } = useFaqDocuments(
    selectedCategory === 'ALL' ? undefined : selectedCategory,
  );
  const deleteMutation = useDeleteFaqDocument();

  // Client-side search filtering
  const filteredDocuments = React.useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q) ||
        doc.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [documents, searchQuery]);

  const handleCreate = () => {
    setDocumentToEdit(null);
    setDialogOpen(true);
  };

  const handleEdit = (doc: FaqDocument) => {
    setDocumentToEdit(doc);
    setDialogOpen(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete knowledge document "${title}"?`)) {
      setDeletingId(id);
      deleteMutation.mutate(id, {
        onSettled: () => setDeletingId(null),
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-lg border border-border">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span>Campus AI Knowledge Base</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage approved records used by Gemini RAG to answer student & staff queries.
          </p>
        </div>

        <Button onClick={handleCreate} size="sm" className="h-8 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Document
        </Button>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search titles, rules, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as FaqCategory | 'ALL')}
            className="h-8 text-xs border border-input bg-background rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-ring text-foreground w-[160px]"
          >
            <option value="ALL">All Categories</option>
            <option value={FaqCategory.GENERAL}>General</option>
            <option value={FaqCategory.HOSTEL}>Hostel</option>
            <option value={FaqCategory.ACADEMIC}>Academic</option>
            <option value={FaqCategory.FACILITIES}>Facilities</option>
            <option value={FaqCategory.MESS}>Mess</option>
            <option value={FaqCategory.GATE_PASS}>Gate Pass</option>
          </select>
        </div>
      </div>

      {/* 3. Document Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-semibold">Title & Preview</TableHead>
              <TableHead className="text-xs font-semibold">Category</TableHead>
              <TableHead className="text-xs font-semibold">Target Audience</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-xs text-muted-foreground">
                  Loading knowledge base documents...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-xs text-rose-500">
                  Failed to load knowledge documents.{' '}
                  <Button variant="link" size="sm" onClick={() => refetch()}>
                    Retry
                  </Button>
                </TableCell>
              </TableRow>
            ) : filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-xs text-muted-foreground">
                  No knowledge documents found for this criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc._id} className="text-xs">
                  <TableCell className="max-w-[280px]">
                    <div className="font-semibold text-foreground truncate">{doc.title}</div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {doc.content}
                    </div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.tags.map((t) => (
                          <span key={t} className="text-[9px] font-mono bg-muted px-1 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono uppercase">
                      {doc.category}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {doc.targetRoles && doc.targetRoles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {doc.targetRoles.map((r) => (
                          <Badge key={r} variant="secondary" className="text-[9px] capitalize">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">All Roles</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {doc.isApproved ? (
                      <Badge variant="secondary" className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                        <CheckCircle className="mr-1 h-3 w-3" /> Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400">
                        <XCircle className="mr-1 h-3 w-3" /> Draft
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(doc)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === doc._id}
                        onClick={() => handleDelete(doc._id, doc.title)}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. Modal Dialog for Create/Edit */}
      <AiDocumentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        documentToEdit={documentToEdit}
      />
    </div>
  );
}
