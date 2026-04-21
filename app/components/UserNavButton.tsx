"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UserNavButton() {
  const [logueado, setLogueado] = useState(false);

  useEffect(() => {
    const revisarSesion = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setLogueado(!!user);
    };

    revisarSesion();
  }, []);

  if (logueado) {
    return (
      <Link href="/perfil" className="flex flex-col items-center gap-1">
        <span className="text-xl">👤</span>
        <span>Perfil</span>
      </Link>
    );
  }

  return (
    <Link href="/login" className="flex flex-col items-center gap-1">
      <span className="text-xl">🔐</span>
      <span>Login</span>
    </Link>
  );
}