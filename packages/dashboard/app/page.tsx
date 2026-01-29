import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to setup page by default
  redirect("/setup");
}
