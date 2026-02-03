import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { type AppDispatch } from "../../app/store";

import {
  apiSlice,
  useExchangeTokensMutation,
  useVerifyDecklistSessionQuery,
} from "../../api/apiSlice";
import { useGoBack } from "../../hooks";
import LoadingSpinner from "../../components/LoadingSpinner";

const CodeEntry = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [code, setCode] = useState<string>("");
  const [exchange, { isLoading }] = useExchangeTokensMutation();
  const [error, setError] = useState<string | null>(null);
  const Back = useGoBack("/");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = code.trim();
    if (!trimmed) {
      setError("Please enter your edit code.");
      return;
    }

    try {
      await exchange({ code: trimmed }).unwrap();
      const verifyRes = await dispatch(
        apiSlice.endpoints.verifyDecklistSession.initiate(undefined, {
          forceRefetch: true,
        })
      ).unwrap();

      if (!verifyRes.active) {
        setError("Session could not be established. Please try again.");
        return;
      }
      navigate("/decklists/edit", { replace: true });
    } catch (err: any) {
      const msg =
        err?.data?.detail ||
        (err?.status === 401
          ? "Invalid or expired code."
          : "Something went wrong.");
      setError(msg);
    }
  };
  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-semibold">Unlock decklist editing</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Paste the code you received from Discord by running the /editdecklist
        command. It expires after 30 minutes.
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
          placeholder="e.g. aBcdE123423"
          autoComplete="one-time-code"
        />

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="flex gap-2">
          <Back />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md grow bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
          >
            {isLoading ? "Verifying..." : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function Gatekeeper() {
  const navigate = useNavigate();
  const { data, isLoading: isVerifying } = useVerifyDecklistSessionQuery();
  useEffect(() => {
    if (data && data?.active) {
      navigate("/decklists/edit", { replace: true });
    }
  }, [data?.expires_at, navigate]);

  if (isVerifying) {
    return <LoadingSpinner />;
  }

  return <CodeEntry />;
}
