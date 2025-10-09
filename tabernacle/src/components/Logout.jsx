import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import auth from "../helpers/authHelpers";

export default function ({ loggedIn, setLoggedIn }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (loggedIn) {
      setLoggedIn(false);
      auth.removeToken();
    }
    navigate("/");
  });
  return null;
}
