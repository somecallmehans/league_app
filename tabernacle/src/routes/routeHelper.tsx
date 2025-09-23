import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  loggedIn: boolean;
  children: ReactNode;
}

const PrivateRoute = ({ children, loggedIn }: PrivateRouteProps): ReactNode =>
  !!loggedIn ? children : <Navigate to="/" replace />;

export default PrivateRoute;
