"use client";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="mx-auto justify-center self-center">
      <SignIn />
    </div>
  );
}
