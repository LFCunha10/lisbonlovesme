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
      
      // Simply redirect to the API endpoint for downloading
      window.location.href = "/api/export-database";
      
      // Set a timeout to reset the loading state after a few seconds
      // since we can't detect when the download is complete
      setTimeout(() => {
        setIsExporting(false);
      }, 3000);
    } catch (error: any) {
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