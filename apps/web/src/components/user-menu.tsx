"use client";

import { useRouter } from "next/navigation";

import { useAuthClient } from "@/lib/auth-client";

export default function UserMenu() {
  const { user, signOut, isLoading } = useAuthClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  if (isLoading) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => router.push("/login")}
        className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-sm text-white hover:bg-indigo-700"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-700 text-sm">{user.email}</span>
      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-200"
      >
        Sign Out
      </button>
    </div>
  );
}
