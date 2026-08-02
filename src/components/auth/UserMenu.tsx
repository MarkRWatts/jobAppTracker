import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { signOut } from "@/auth";

// Server Component, not a client island — this needs real session data,
// which only exists server-side.
export async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/login" className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-200">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="max-w-[10rem] truncate text-sm text-zinc-600 dark:text-zinc-300">
        {user.name ?? user.email}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="text-sm font-medium text-zinc-500 hover:underline dark:text-zinc-400"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
