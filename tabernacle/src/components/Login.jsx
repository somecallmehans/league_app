import React, { useState } from "react";
import { toast } from "react-toastify";
import { Navigate } from "react-router-dom";

import { Field, Input, Label, Button } from "@headlessui/react";
import { useLoginMutation } from "../api/apiSlice";
import auth from "../helpers/authHelpers.ts";

export default function ({ loggedIn, setLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [login] = useLoginMutation();
  if (loggedIn) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await login({ username, password }).unwrap();
      auth.setToken(result.access, result.refresh);
      setLoggedIn(true);
    } catch (err) {
      console.error("Failed to login: ", err);
      toast.error("Failed to login");
      return;
    }
    toast.success("Logged in successfully");
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-4 mb-4">
        <h2
          className="text-2xl font-bold text-sky-500 mb-4"
          style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.1)" }}
        >
          Login
        </h2>
        <form onSubmit={handleLogin}>
          <Field className="py-2 px-3 ">
            <Label className="block text-black">Username</Label>
            <Input
              name="username"
              type="text"
              className="rounded border p-2 w-full"
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
          <Field className="py-2 px-3">
            <Label className="block text-black">Password</Label>
            <Input
              name="password"
              type="password"
              className="rounded border p-2 w-full"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button
            type="submit"
            className="rounded bg-sky-600 py-2 px-4 text-sm text-white data-[hover]:bg-sky-500 data-[active]:bg-sky-700"
          >
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
}
