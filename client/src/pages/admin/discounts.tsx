import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type DiscountCode = {
  id: number;
  code: string;
  name: string;
  category: 'percentage' | 'fixed_value' | 'free_tour';
  value: number;
  validUntil?: string | null;
  usageLimit?: number | null;
  usedCount?: number | null;
  isActive?: boolean | null;
  createdAt?: string | null;
};

export default function AdminDiscountsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ code: string; name: string; category: DiscountCode['category']; value: string; validUntil: string; usageLimit: string; oneTime: boolean }>({ code: '', name: '', category: 'percentage', value: '', validUntil: '', usageLimit: '', oneTime: false });

  const { data: discounts, isLoading } = useQuery<DiscountCode[]>({ queryKey: ['/api/admin/discounts'] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        category: form.category,
        value: Number(form.value),
      };
      if (form.validUntil) payload.validUntil = form.validUntil;
      if (form.oneTime) payload.oneTime = true; else if (form.usageLimit) payload.usageLimit = Number(form.usageLimit);
      const res = await fetch('/api/admin/discounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/discounts'] });
      setOpen(false);
      setForm({ code: '', name: '', category: 'percentage', value: '', validUntil: '', usageLimit: '', oneTime: false });
      toast({ title: 'Created', description: 'Discount code created.' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.message || 'Failed to create discount code', variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/discounts/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
      return true;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/discounts'] });
      toast({ title: 'Deleted', description: 'Discount code removed.' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.message || 'Failed to delete discount code', variant: 'destructive' })
  });

  return (
    <AdminLayout title="Discount Codes">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Discount Codes</h1>
          <p className="text-gray-500">Create and manage promo/discount codes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New Code</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Discount Code</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div>
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="WELCOME30" />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Welcome 30%" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed_value">Fixed value (€ cents)</SelectItem>
                      <SelectItem value="free_tour">Free tour (people)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Value</Label>
                  <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="e.g. 30 or 2000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valid until (optional)</Label>
                  <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
                </div>
                <div>
                  <Label>Usage limit (optional)</Label>
                  <Input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="e.g. 100" />
                </div>
              </div>
              <div>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.oneTime} onChange={(e) => setForm({ ...form, oneTime: e.target.checked })} /> One-time code
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate()} disabled={!form.code || !form.name || !form.value || createMutation.isPending}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading…</div>
          ) : !discounts || discounts.length === 0 ? (
            <div className="text-gray-500">No discount codes.</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Valid until</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discounts.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell><code>{d.code}</code></TableCell>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>{d.category}</TableCell>
                      <TableCell>{d.category === 'percentage' ? `${d.value}%` : d.category === 'fixed_value' ? `€${(d.value/100).toFixed(2)}` : `${d.value} ppl`}</TableCell>
                      <TableCell>{d.validUntil ? new Date(d.validUntil).toLocaleDateString('pt-PT') : '-'}</TableCell>
                      <TableCell>{(d.usedCount || 0)}{d.usageLimit ? `/${d.usageLimit}` : ''}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => { if (confirm('Delete this code?')) deleteMutation.mutate(d.id); }}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
