import React from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function AdminStorageDiagnostics() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/storage/diagnostics"],
    select: (d: any) => d as {
      uploadDir: string;
      exists: boolean;
      isDirectory: boolean;
      readable: boolean;
      writable: boolean;
      fileCount: number;
      totalBytes: number;
      examples: { name: string; size: number }[];
    },
  });

  return (
    <AdminLayout title="Storage Diagnostics">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Uploads Storage</CardTitle>
              <CardDescription>Diagnostics for the persistent uploads directory</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent>
            {!data ? (
              <div className="text-sm text-gray-500">{isLoading ? "Loading..." : "No data"}</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-xs uppercase text-gray-500">Path</div>
                  <div className="font-mono break-all text-sm">{data.uploadDir}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={data.exists ? "default" : "secondary"}>
                    Exists: {String(data.exists)}
                  </Badge>
                  <Badge variant={data.isDirectory ? "default" : "secondary"}>
                    Directory: {String(data.isDirectory)}
                  </Badge>
                  <Badge variant={data.readable ? "default" : "secondary"}>
                    Readable: {String(data.readable)}
                  </Badge>
                  <Badge variant={data.writable ? "default" : "secondary"}>
                    Writable: {String(data.writable)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs uppercase text-gray-500">Files</div>
                    <div className="text-lg font-semibold">{data.fileCount}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-gray-500">Total Size</div>
                    <div className="text-lg font-semibold">{formatBytes(data.totalBytes || 0)}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs uppercase text-gray-500 mb-2">Example Files</div>
                  {data.examples?.length ? (
                    <ul className="text-sm space-y-1">
                      {data.examples.map((e, i) => (
                        <li key={i} className="flex justify-between gap-4">
                          <span className="font-mono break-all">{e.name}</span>
                          <span className="text-gray-500">{formatBytes(e.size)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500">No files yet.</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

