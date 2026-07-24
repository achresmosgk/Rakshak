import { Navigate } from "react-router-dom";
import { getSession } from "../auth";

export default function RequireAuth({ children }) {
  const session = getSession();
  if (!session?.token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
