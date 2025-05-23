import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Database, AlertCircle } from "lucide-react";

export default function DatabaseExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportClick = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      
      // Use fetch to get the file as a blob
      const response = await fetch("/api/export-database");
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }
      
      // Get the filename from the Content-Disposition header if available
      let filename = "lisbonlovesme_database_export.sql";
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Convert response to blob
      const blob = await response.blob();
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setIsExporting(false);
    } catch (error: any) {
      console.error("Export error:", error);
      setExportError(error.message || "Failed to export database");
      setIsExporting(false);
    }
  };

  return (
    <AdminLayout title="Database Export">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Export
          </CardTitle>
          <CardDescription>
            Export all your data for backup or migration purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
            <h3 className="font-medium text-lg mb-2">What will be exported:</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
              <li>All tours with complete details</li>
              <li>All booking records with customer information</li>
              <li>All availability slots with timing information</li>
              <li>All testimonials/reviews from customers</li>
              <li>All closed day settings and admin preferences</li>
            </ul>
          </div>
          
          {exportError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Export Failed</AlertTitle>
              <AlertDescription>{exportError}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-center pt-2">
            <Button 
              size="lg" 
              onClick={handleExportClick}
              disabled={isExporting}
              className="gap-2"
            >
              <Download className="h-5 w-5" />
              {isExporting ? "Preparing Export..." : "Export Database"}
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
            The export will be downloaded as a SQL file that can be imported into any PostgreSQL database.
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}