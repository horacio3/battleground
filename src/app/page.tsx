"use client"; // Add this at the top of the file

import { useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const session = useSession();

  if (!session.isLoaded) return;

  if (session.isSignedIn) {
    return router.replace("/chat");
  } else {
    return router.replace("/sign-in");
  }
}
