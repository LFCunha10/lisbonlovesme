import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdminProtectedRoute from "@/components/admin/protected-route";
import { Link } from "wouter";

export default function ChangePasswordPage() {
  return (
    <AdminProtectedRoute>
      <PasswordChangeForm />
    </AdminProtectedRoute>
  );
}

function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Validate current password
      if (currentPassword !== "lisbonlovesme123") {
        setError("Current password is incorrect");
        setIsLoading(false);
        return;
      }

      // Validate new password
      if (newPassword.length < 8) {
        setError("New password must be at least 8 characters long");
        setIsLoading(false);
        return;
      }

      // Validate confirmation
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        setIsLoading(false);
        return;
      }

      // In a real application, we would update the password in the database
      // For this demo, we'll just update it in localStorage
      localStorage.setItem("adminPassword", newPassword);

      // Show success message
      toast({
        title: "Password Updated",
        description: "Your admin password has been successfully changed.",
      });

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("An error occurred while updating your password.");
      console.error("Password update error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Change Password - Admin Dashboard</title>
      </Helmet>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Change Admin Password</h1>
          <Button variant="outline" asChild>
            <Link href="/admin">Back to Dashboard</Link>
          </Button>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Update Your Password</CardTitle>
            <CardDescription>
              Choose a strong password that you don't use elsewhere
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                />
                <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Make sure to remember your new password
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}