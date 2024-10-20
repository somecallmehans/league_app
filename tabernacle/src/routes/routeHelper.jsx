import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, loggedIn }) =>
  !!loggedIn ? children : <Navigate to="/" replace />;

export default PrivateRoute;
