"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import UserNavButton from "../components/UserNavButton";
import { useUserLocation } from "../components/useUserLocation";
import {
  calcularDistanciaEnMetros,
  formatearDistancia,
} from "@/lib/distance";
import FavoriteButton from "../components/FavoriteButton";

type Publicacion = {
  id: number;
  titulo: string;
  descripcion: string;
  precio: string;
  telefono: string;
  categoria: string;
  ubicacion: string;
  distancia: string;
  disponible: boolean;
  imagen_url: string | null;
  latitud: number | null;
  longitud: number | null;
};

type PublicacionConDistancia = Publicacion & {
  distanciaCalculada: number | null;
};

export default function AvisosPage() {
  const [avisos, setAvisos] = useState<Publicacion[]>([]);
  const [mensaje, setMensaje] = useState("Cargando publicaciones...");
  const { latUsuario, lonUsuario } = useUserLocation();

  const [busqueda, setBusqueda] = useState("");
  const [ordenCercania, setOrdenCercania] = useState(true);
  const [soloDisponibles, setSoloDisponibles] = useState(false);

  useEffect(() => {
    const cargarAvisos = async () => {
      const { data, error } = await supabase
        .from("publicaciones")
        .select("*")
        .eq("categoria", "Avisos")
        .order("id", { ascending: false });

      if (error) {
        setMensaje("Error al cargar publicaciones");
        return;
      }

      setAvisos(data || []);
      setMensaje("");
    };

    cargarAvisos();
  }, []);

  const avisosProcesados: PublicacionConDistancia[] = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    let lista = avisos
      .filter((aviso) => {
        if (!texto) return true;
        return aviso.titulo.toLowerCase().startsWith(texto);
      })
      .map((aviso) => {
        let distanciaCalculada: number | null = null;

        if (
          latUsuario !== null &&
          lonUsuario !== null &&
          aviso.latitud !== null &&
          aviso.longitud !== null
        ) {
          distanciaCalculada = calcularDistanciaEnMetros(
            latUsuario,
            lonUsuario,
            aviso.latitud,
            aviso.longitud
          );
        }

        return {
          ...aviso,
          distanciaCalculada,
        };
      });

    if (soloDisponibles) {
      lista = lista.filter((item) => item.disponible);
    }

    if (ordenCercania) {
      lista = lista.sort((a, b) => {
        if (a.distanciaCalculada === null && b.distanciaCalculada === null)
          return 0;
        if (a.distanciaCalculada === null) return 1;
        if (b.distanciaCalculada === null) return -1;
        return a.distanciaCalculada - b.distanciaCalculada;
      });
    }

    return lista;
  }, [
    avisos,
    latUsuario,
    lonUsuario,
    busqueda,
    soloDisponibles,
    ordenCercania,
  ]);

  const crearLinkWhatsApp = (telefono: string, titulo: string) => {
    const mensaje = `Hola, vi tu aviso en la app. Me interesa "${titulo}". ¿Sigue vigente?`;
    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  };

  return (
    <main className="min-h-screen bg-[#eef2f5] flex justify-center">
      <div className="w-full max-w-sm min-h-screen bg-[#eef2f5] pb-24">
        <div className="bg-gray-700 text-white rounded-b-3xl px-4 pt-6 pb-5 shadow-md">
          <div className="flex items-center justify-between text-sm mb-4">
            <Link
              href="/"
              className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium"
            >
              ←
            </Link>
            <span>🔔</span>
          </div>

          <h1 className="text-2xl font-bold text-center">Avisos</h1>

          <div className="mt-4 bg-white rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
            <span className="text-gray-400">🔍</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full outline-none text-gray-700 placeholder:text-gray-400"
              placeholder="Buscar avisos..."
            />
            <span className="text-gray-400">⚙️</span>
          </div>
        </div>

        <section className="px-4 mt-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setOrdenCercania(!ordenCercania)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                ordenCercania
                  ? "bg-gray-700 text-white"
                  : "border bg-white text-gray-700"
              }`}
            >
              📍 Más cercanos
            </button>

            <button
              onClick={() => setSoloDisponibles(!soloDisponibles)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                soloDisponibles
                  ? "bg-green-600 text-white"
                  : "border bg-white text-gray-700"
              }`}
            >
              ✅ Disponibles
            </button>
          </div>
        </section>

        <section className="px-4 mt-5">
          <div className="mt-3 space-y-3">
            {mensaje ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">{mensaje}</p>
              </div>
            ) : avisosProcesados.length === 0 ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">
                  No se encontraron resultados.
                </p>
              </div>
            ) : (
              avisosProcesados.map((aviso) => (
                <div
                  key={aviso.id}
                  className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200"
                >
                  <div className="flex gap-3">
                    <Link
                      href={`/publicacion/${aviso.id}`}
                      className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 block shrink-0"
                    >
                      {aviso.imagen_url ? (
                        <img
                          src={aviso.imagen_url}
                          alt={aviso.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          📢
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/publicacion/${aviso.id}`}
                        className="font-semibold text-sm text-gray-900 hover:underline block truncate"
                      >
                        {aviso.titulo}
                      </Link>

                      {aviso.descripcion && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                          {aviso.descripcion}
                        </p>
                      )}

                      <p className="text-xs text-gray-500 mt-1">
                        {aviso.ubicacion || "Ubicación no indicada"}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {formatearDistancia(aviso.distanciaCalculada)}
                      </p>

                      <p
                        className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-medium ${
                          aviso.disponible
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {aviso.disponible ? "Disponible" : "No disponible"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={crearLinkWhatsApp(aviso.telefono, aviso.titulo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-xl text-center"
                    >
                      Contactar
                    </a>

                    <FavoriteButton publicacionId={aviso.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none">
          <div className="w-full max-w-sm bg-white border-t border-gray-200 rounded-t-3xl px-6 py-3 shadow-lg pointer-events-auto">
            <div className="flex items-end justify-between text-xs text-gray-500">
              <Link href="/" className="flex flex-col items-center gap-1">
                <span className="text-xl">🏠</span>
                <span>Inicio</span>
              </Link>

              <button className="flex flex-col items-center gap-1 text-gray-700 font-medium">
                <span className="text-xl">🔍</span>
                <span>Buscar</span>
              </button>

              <Link
                href="/publicar"
                className="flex flex-col items-center gap-1 -mt-8"
              >
                <span className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl shadow-md">
                  +
                </span>
                <span className="mt-1">Publicar</span>
              </Link>

              <Link href="/favoritos" className="flex flex-col items-center">
                <span className="text-xl">❤️</span>
                <span>Favoritos</span>
              </Link>

              <UserNavButton />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}