"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createUser } from "@/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2 px-4 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50"
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

export function SetupForm() {
  const [error, formAction] = useActionState(createUser, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <SubmitButton />
    </form>
  );
}
