import { redirect } from "next/navigation";

// Signup is now handled via Kakao OAuth on the login page.
// This route simply redirects to /auth/login.
export default function SignupPage() {
  redirect("/auth/login");
}
