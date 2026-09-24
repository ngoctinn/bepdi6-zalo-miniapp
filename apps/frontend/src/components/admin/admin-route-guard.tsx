import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "zmp-ui";

interface AdminRouteGuardProps {
  requiredRole?: "ADMIN" | "STAFF";
}

export function AdminRouteGuard({
  requiredRole = "STAFF",
}: AdminRouteGuardProps) {
  const { customer, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner logo />
      </div>
    );
  }

  // If requiredRole is ADMIN, only ADMIN can enter. If STAFF, both STAFF and ADMIN can enter.
  const hasAccess =
    requiredRole === "ADMIN"
      ? customer?.role === "ADMIN"
      : customer?.role === "ADMIN" || customer?.role === "STAFF";

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRouteGuard;
