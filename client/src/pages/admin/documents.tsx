import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Upload, Link as LinkIcon } from "lucide-react";

type Doc = {
  id: number;
  slug: string;
  title: string | null;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  size: number;
  createdAt?: string | null;
};

function getCsrfTokenFromCookie(): string | undefined {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('csrfToken='))
    ?.split('=')[1];
}

export default function AdminDocumentsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");

  const { data: docs, isLoading } = useQuery<Doc[]>({
    queryKey: ['/api/documents'],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Please choose a file');
      if (!slug) throw new Error('Please enter a slug');

      const form = new FormData();
      form.append('file', file);
      form.append('slug', slug);
      if (title) form.append('title', title);

      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'CSRF-Token': getCsrfTokenFromCookie() || '',
        },
        body: form,
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to upload document');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/documents'] });
      setOpen(false);
      setFile(null);
      setSlug('');
      setTitle('');
      toast({ title: 'Uploaded', description: 'Document uploaded successfully.' });
    },
    onError: (e: any) => {
      toast({ title: 'Upload failed', description: e?.message || 'Could not upload document', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'CSRF-Token': getCsrfTokenFromCookie() || '' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await res.text());
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({ title: 'Deleted', description: 'Document removed.' });
    },
    onError: (e: any) => {
      toast({ title: 'Delete failed', description: e?.message || 'Could not delete document', variant: 'destructive' });
    }
  });

  const baseUrl = useMemo(() => {
    const domain = window.location.origin;
    return domain.replace(/\/$/, '');
  }, []);

  return (
    <AdminLayout title="Documents">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-gray-500">Upload files and assign shareable URLs</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" /> Add Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>Pick a file and define its URL slug</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>File</Label>
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <p className="text-xs text-gray-500">Allowed: PDF, DOCX, XLSX, TXT, ZIP, JPG, PNG, WEBP</p>
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="3-day-tour" />
                <p className="text-xs text-gray-500">This creates {baseUrl}/{slug || '<slug>'}</p>
              </div>
              <div className="space-y-2">
                <Label>Title (optional)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="3-Day Tour Itinerary" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Uploading…' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Documents</CardTitle>
          <CardDescription>Click the URL to open or share it</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading…</div>
          ) : !docs || docs.length === 0 ? (
            <div className="text-gray-500">No documents yet.</div>
          ) : (
            <div className="divide-y">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{d.title || d.originalFilename}</div>
                    <div className="text-sm text-gray-500 truncate">{d.originalFilename} • {(d.size/1024).toFixed(1)} KB</div>
                    <a className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1" href={`/${d.slug}`} target="_blank" rel="noreferrer">
                      <LinkIcon className="w-4 h-4" /> {baseUrl}/{d.slug}
                    </a>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <Button variant="destructive" size="sm" onClick={() => {
                      if (confirm('Delete this document?')) deleteMutation.mutate(d.id);
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

