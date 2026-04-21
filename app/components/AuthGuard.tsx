"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const revisarSesion = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setLoading(false);
    };

    revisarSesion();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-600">Verificando sesión...</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}