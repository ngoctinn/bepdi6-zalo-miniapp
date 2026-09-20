import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Spinner } from "zmp-ui";

export function StaffRouteGuard() {
  const { customer, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner logo />
      </div>
    );
  }

  const isStaff = customer?.role === "ADMIN" || customer?.role === "STAFF";

  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
