import React, { useState } from "react";
import { toast } from "react-toastify";
import { Field, Input, Label, Button } from "@headlessui/react";
import { useChangePasswordMutation } from "../../api/apiSlice";

export default function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== newPasswordConfirm) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      }).unwrap();
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err) {
      // Error toast is shown by baseQueryWithReauth
      console.error("Failed to change password:", err);
    }
  };

  return (
    <div className="bg-white flex flex-col gap-6 rounded-lg p-4 shadow-md border max-w-md">
      <h3 className="text-lg font-semibold text-sky-600">Change Password</h3>
      <p className="text-sm text-slate-600">
        Update your account password. You will need to enter your current
        password to confirm the change.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field>
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            Current Password
          </Label>
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </Field>
        <Field>
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            New Password
          </Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            At least 8 characters. Avoid common passwords and numeric-only
            passwords.
          </p>
        </Field>
        <Field>
          <Label className="block text-sm font-medium text-slate-700 mb-1">
            Confirm New Password
          </Label>
          <Input
            type="password"
            value={newPasswordConfirm}
            onChange={(e) => setNewPasswordConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </Field>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 rounded bg-sky-600 text-white font-medium hover:bg-sky-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
