import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotesApp from "@/components/NotesApp";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rede de segurança: o middleware já protege, mas garantimos aqui.
  if (!user) redirect("/login");

  return <NotesApp userId={user.id} userEmail={user.email ?? ""} />;
}
