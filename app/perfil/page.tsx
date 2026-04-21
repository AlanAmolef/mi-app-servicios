"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthGuard from "../components/AuthGuard";

type Usuario = {
  email: string;
  id: string;
};

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [mensaje, setMensaje] = useState("Cargando perfil...");
  const router = useRouter();

  useEffect(() => {
    const cargarUsuario = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setMensaje("Debes iniciar sesión");
        setUsuario(null);
        return;
      }

      setUsuario({
        email: user.email || "",
        id: user.id,
      });
      setMensaje("");
    };

    cargarUsuario();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#eef2f5] flex justify-center">
        <div className="w-full max-w-sm min-h-screen bg-[#eef2f5] pb-24">
          
          {/* Header */}
          <div className="bg-blue-600 text-white rounded-b-3xl px-4 pt-6 pb-5 shadow-md">
            <div className="flex items-center justify-between text-sm mb-4">
              <Link
                href="/"
                className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium"
              >
                ←
              </Link>
              <span>👤</span>
            </div>

            <h1 className="text-2xl font-bold text-center">Perfil</h1>
            <p className="text-center text-sm text-blue-100 mt-2">
              Tu espacio personal dentro de la app
            </p>
          </div>

          {/* Contenido */}
          <section className="px-4 mt-5 space-y-4">
            {mensaje && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">{mensaje}</p>
              </div>
            )}

            {usuario && (
              <>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-500">Correo</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {usuario.email}
                  </p>

                  <p className="text-xs text-gray-400 mt-3 break-all">
                    ID: {usuario.id}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 space-y-3">
                  <Link
                    href="/mis-publicaciones"
                    className="block w-full rounded-xl bg-blue-600 text-white text-center py-3 font-medium"
                  >
                    Ver mis publicaciones
                  </Link>

                  <button
                    className="w-full rounded-xl bg-gray-700 text-white py-3 font-medium"
                    onClick={cerrarSesion}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </section>

        </div>
      </main>
    </AuthGuard>
  );
}