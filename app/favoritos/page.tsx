"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AuthGuard from "../components/AuthGuard";
import UserNavButton from "../components/UserNavButton";
import { useUserLocation } from "../components/useUserLocation";
import {
  calcularDistanciaEnMetros,
  formatearDistancia,
} from "@/lib/distance";

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
  latitud?: number | null;
  longitud?: number | null;
};

type PublicacionConDistancia = Publicacion & {
  distanciaCalculada: number | null;
};

export default function FavoritosPage() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [mensaje, setMensaje] = useState("Cargando favoritos...");
  const { latUsuario, lonUsuario, pedirUbicacion } = useUserLocation();

  useEffect(() => {
    const cargarFavoritos = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMensaje("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase
        .from("favoritos")
        .select("publicacion_id, publicaciones(*)")
        .eq("user_id", user.id);

      if (error) {
        setMensaje("Error al cargar favoritos");
        return;
      }

      const publicacionesMapeadas =
        data?.map((item: any) => item.publicaciones).filter(Boolean) || [];

      setPublicaciones(publicacionesMapeadas);
      setMensaje("");
    };

    cargarFavoritos();
  }, []);

  const publicacionesConDistancia: PublicacionConDistancia[] = useMemo(() => {
    return publicaciones.map((item) => {
      let distanciaCalculada: number | null = null;

      if (
        latUsuario !== null &&
        lonUsuario !== null &&
        item.latitud !== null &&
        item.latitud !== undefined &&
        item.longitud !== null &&
        item.longitud !== undefined
      ) {
        distanciaCalculada = calcularDistanciaEnMetros(
          latUsuario,
          lonUsuario,
          item.latitud,
          item.longitud
        );
      }

      return {
        ...item,
        distanciaCalculada,
      };
    });
  }, [publicaciones, latUsuario, lonUsuario]);

  const crearLinkWhatsApp = (telefono: string, titulo: string) => {
    const mensaje = `Hola, vi tu publicación en la app. Me interesa "${titulo}". ¿Sigue disponible?`;
    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#eef2f5] flex justify-center">
        <div className="w-full max-w-sm min-h-screen bg-[#eef2f5] pb-24">
          <div className="bg-slate-600 text-white rounded-b-3xl px-4 pt-6 pb-5 shadow-md">
            <div className="flex items-center justify-between text-sm mb-4">
              <Link
                href="/"
                className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium"
              >
                ←
              </Link>
              <span>❤️</span>
            </div>

            <h1 className="text-2xl font-bold text-center">Favoritos</h1>
            <p className="text-center text-sm text-slate-100 mt-2">
              Tus publicaciones guardadas
            </p>
          </div>

          <section className="px-4 mt-5">
            {mensaje ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">{mensaje}</p>
              </div>
            ) : publicacionesConDistancia.length === 0 ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">
                  Aún no tienes favoritos.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {publicacionesConDistancia.map((item) => (
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
                            ❤️
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

                        <p className="text-xs text-gray-500 mt-1">
                          {formatearDistancia(item.distanciaCalculada)}
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

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a
                        href={crearLinkWhatsApp(item.telefono, item.titulo)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl text-center"
                      >
                        Contactar
                      </a>

                      <button
                        onClick={async () => {
                          const {
                            data: { user },
                          } = await supabase.auth.getUser();

                          if (!user) return;

                          const { error } = await supabase
                            .from("favoritos")
                            .delete()
                            .eq("user_id", user.id)
                            .eq("publicacion_id", item.id);

                          if (!error) {
                            setPublicaciones((prev) =>
                              prev.filter((p) => p.id !== item.id)
                            );
                          }
                        }}
                        className="bg-red-500 text-white text-sm font-medium px-4 py-2 rounded-xl"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none">
            <div className="w-full max-w-sm bg-white border-t border-gray-200 rounded-t-3xl px-6 py-3 shadow-lg pointer-events-auto">
              <div className="flex items-end justify-between text-xs text-gray-500">
                <Link
                  href="/"
                  onClick={pedirUbicacion}
                  className="flex flex-col items-center"
                >
                  <span className="text-xl">🏠</span>
                  <span>Inicio</span>
                </Link>

                <Link
                  href="/buscar"
                  onClick={pedirUbicacion}
                  className="flex flex-col items-center"
                >
                  <span className="text-xl">🔍</span>
                  <span>Buscar</span>
                </Link>

                <Link
                  href="/publicar"
                  onClick={pedirUbicacion}
                  className="flex flex-col items-center -mt-8"
                >
                  <span className="w-14 h-14 rounded-full bg-slate-600 text-white flex items-center justify-center text-3xl shadow-md">
                    +
                  </span>
                  <span className="mt-1">Publicar</span>
                </Link>

                <Link
                  href="/favoritos"
                  onClick={pedirUbicacion}
                  className="flex flex-col items-center text-slate-600 font-medium"
                >
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