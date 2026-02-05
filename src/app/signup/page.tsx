import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">Repair Shop</h1>
      <SignUp />
    </main>
  );
}
