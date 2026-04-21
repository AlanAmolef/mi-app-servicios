"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type UserType = {
  id: string;
} | null;

// Cache global
let cachedUser: UserType = null;
let cachedUserLoaded = false;
let cachedUserPromise: Promise<UserType> | null = null;

const getUserCached = async (): Promise<UserType> => {
  if (cachedUserLoaded) return cachedUser;

  if (cachedUserPromise) return cachedUserPromise;

  cachedUserPromise = (async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error obteniendo sesión:", error.message);
      cachedUser = null;
      cachedUserLoaded = true;
      cachedUserPromise = null;
      return null;
    }

    const user = session?.user
      ? { id: session.user.id }
      : null;

    cachedUser = user;
    cachedUserLoaded = true;
    cachedUserPromise = null;

    return user;
  })();

  return cachedUserPromise;
};

type Props = {
  publicacionId: number;
};

export default function FavoriteButton({ publicacionId }: Props) {
  const [esFavorito, setEsFavorito] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    const cargarFavorito = async () => {
      setCargando(true);

      const user = await getUserCached();

      if (!activo) return;

      if (!user) {
        setUserId(null);
        setEsFavorito(false);
        setCargando(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("favoritos")
        .select("id")
        .eq("user_id", user.id)
        .eq("publicacion_id", publicacionId)
        .maybeSingle();

      if (!activo) return;

      if (error) {
        console.error("Error consultando favoritos:", error.message);
        setEsFavorito(false);
        setCargando(false);
        return;
      }

      setEsFavorito(!!data);
      setCargando(false);
    };

    cargarFavorito();

    return () => {
      activo = false;
    };
  }, [publicacionId]);

  const toggleFavorito = async () => {
    if (!userId) {
      alert("Debes iniciar sesión para guardar favoritos");
      return;
    }

    if (esFavorito) {
      const { error } = await supabase
        .from("favoritos")
        .delete()
        .eq("user_id", userId)
        .eq("publicacion_id", publicacionId);

      if (error) {
        console.error("Error eliminando favorito:", error.message);
        return;
      }

      setEsFavorito(false);
      return;
    }

    const { error } = await supabase.from("favoritos").insert([
      {
        user_id: userId,
        publicacion_id: publicacionId,
      },
    ]);

    if (error) {
      console.error("Error guardando favorito:", error.message);
      return;
    }

    setEsFavorito(true);
  };

  return (
    <button
      onClick={toggleFavorito}
      disabled={cargando}
      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
      type="button"
    >
      {cargando ? "..." : esFavorito ? "❤️ Guardado" : "🤍 Favorito"}
    </button>
  );
}