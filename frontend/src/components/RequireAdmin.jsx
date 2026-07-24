import { Navigate } from "react-router-dom";
import { getAdminSession } from "../adminAuth";

export default function RequireAdmin({ children }) {
  const session = getAdminSession();
  if (!session?.token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
