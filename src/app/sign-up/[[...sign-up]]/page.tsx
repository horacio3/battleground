"use client";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="mx-auto justify-center self-center ">
      <SignUp />
    </div>
  );
}
