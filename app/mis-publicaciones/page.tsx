"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AuthGuard from "../components/AuthGuard";
import UserNavButton from "../components/UserNavButton";
import { useUserLocation } from "../components/useUserLocation";

type Publicacion = {
  id: number;
  titulo: string;
  descripcion: string;
  precio: string;
  telefono: string;
  categoria: string;
  ubicacion: string;
  disponible: boolean;
  imagen_url: string | null;
};

export default function MisPublicacionesPage() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [mensaje, setMensaje] = useState("Cargando publicaciones...");
  const { pedirUbicacion } = useUserLocation();

  useEffect(() => {
    const cargarPublicaciones = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMensaje("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase
        .from("publicaciones")
        .select("*")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

      if (error) {
        setMensaje("Error al cargar tus publicaciones");
        return;
      }

      setPublicaciones(data || []);
      setMensaje("");
    };

    cargarPublicaciones();
  }, []);

  const crearLinkWhatsApp = (telefono: string, titulo: string) => {
    const mensaje = `Hola, vi tu publicación en la app. Me interesa "${titulo}". ¿Sigue disponible?`;
    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  };

  const eliminarPublicacion = async (id: number) => {
    const confirmar = confirm("¿Seguro que quieres eliminar esta publicación?");
    if (!confirmar) return;

    const { error } = await supabase.from("publicaciones").delete().eq("id", id);

    if (!error) {
      setPublicaciones((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert("No se pudo eliminar la publicación");
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#eef2f5] flex justify-center">
        <div className="w-full max-w-sm min-h-screen bg-[#eef2f5] pb-24">
          <div className="bg-slate-600 text-white rounded-b-3xl px-4 pt-6 pb-5 shadow-md">
            <div className="flex items-center justify-between text-sm mb-4">
              <Link
                href="/perfil"
                className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium"
              >
                ←
              </Link>
              <span>📦</span>
            </div>

            <h1 className="text-2xl font-bold text-center">Mis publicaciones</h1>
            <p className="text-center text-sm text-slate-100 mt-2">
              Administra lo que has publicado
            </p>
          </div>

          <section className="px-4 mt-5">
            {mensaje ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">{mensaje}</p>
              </div>
            ) : publicaciones.length === 0 ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">
                  Aún no tienes publicaciones.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {publicaciones.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200"
                  >
                    <div className="flex gap-3">
                      <Link
                        href={`/publicacion/${item.id}`}
                        className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 block"
                      >
                        {item.imagen_url ? (
                          <img
                            src={item.imagen_url}
                            alt={item.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            📦
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/publicacion/${item.id}`}
                          className="font-semibold text-sm text-gray-900 truncate hover:underline block"
                        >
                          {item.titulo}
                        </Link>

                        {item.descripcion && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {item.descripcion}
                          </p>
                        )}

                        <p className="text-xs text-slate-700 font-medium mt-1">
                          {item.precio || "Sin precio"}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {item.categoria} · {item.ubicacion || "Sin ubicación"}
                        </p>

                        <p
                          className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-medium ${
                            item.disponible
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {item.disponible ? "Disponible" : "No disponible"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <a
                        href={crearLinkWhatsApp(item.telefono, item.titulo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-green-600 text-white text-sm font-medium px-3 py-2 rounded-xl text-center"
                      >
                        Contactar
                      </a>

                      <Link
                        href={`/editar-publicacion/${item.id}`}
                        className="block w-full bg-slate-600 text-white text-sm font-medium px-3 py-2 rounded-xl text-center"
                      >
                        Editar
                      </Link>

                      <button
                        onClick={() => eliminarPublicacion(item.id)}
                        className="block w-full bg-red-500 text-white text-sm font-medium px-3 py-2 rounded-xl text-center"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* NAVBAR */}
          <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none">
            <div className="w-full max-w-sm bg-white border-t border-gray-200 rounded-t-3xl px-6 py-3 shadow-lg pointer-events-auto">
              <div className="flex items-end justify-between text-xs text-gray-500">

                <Link href="/" onClick={pedirUbicacion} className="flex flex-col items-center">
                  <span className="text-xl">🏠</span>
                  <span>Inicio</span>
                </Link>

                <Link href="/buscar" onClick={pedirUbicacion} className="flex flex-col items-center">
                  <span className="text-xl">🔍</span>
                  <span>Buscar</span>
                </Link>

                <Link href="/publicar" onClick={pedirUbicacion} className="flex flex-col items-center -mt-8">
                  <span className="w-14 h-14 rounded-full bg-slate-600 text-white flex items-center justify-center text-3xl shadow-md">
                    +
                  </span>
                  <span className="mt-1">Publicar</span>
                </Link>

                <Link href="/favoritos" onClick={pedirUbicacion} className="flex flex-col items-center">
                  <span className="text-xl">❤️</span>
                  <span>Favoritos</span>
                </Link>

                <UserNavButton />
              </div>
            </div>
          </div>

        </div>
      </main>
    </AuthGuard>
  );
}