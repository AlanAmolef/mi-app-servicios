"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UserNavButton() {
  const [logueado, setLogueado] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    const revisarSesion = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!activo) return;

        setLogueado(!!session?.user);
      } catch (error) {
        console.error("Error obteniendo sesión:", error);
        if (!activo) return;
        setLogueado(false);
      } finally {
        if (activo) setCargando(false);
      }
    };

    revisarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!activo) return;
      setLogueado(!!session?.user);
      setCargando(false);
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, []);

  if (cargando) {
    return (
      <div className="flex flex-col items-center gap-1 text-gray-400">
        <span className="text-xl">⏳</span>
        <span>Cargando</span>
      </div>
    );
  }

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