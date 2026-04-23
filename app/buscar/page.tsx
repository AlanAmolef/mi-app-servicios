"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import UserNavButton from "../components/UserNavButton";
import FavoriteButton from "../components/FavoriteButton";
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
  latitud: number | null;
  longitud: number | null;
};

type PublicacionConDistancia = Publicacion & {
  distanciaCalculada: number | null;
};

const categoriasDisponibles = [
  "Todas",
  "Servicios",
  "Comida",
  "Arriendos",
  "Avisos",
];

export default function BuscarPage() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [mensaje, setMensaje] = useState("Cargando publicaciones...");
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [ordenCercania, setOrdenCercania] = useState(true);

  const { latUsuario, lonUsuario } = useUserLocation();

  useEffect(() => {
    const cargarPublicaciones = async () => {
      const { data, error } = await supabase
        .from("publicaciones")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        setMensaje("Error al cargar publicaciones");
        return;
      }

      setPublicaciones(data || []);
      setMensaje("");
    };

    cargarPublicaciones();
  }, []);

  const resultados: PublicacionConDistancia[] = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    let lista = publicaciones
      .filter((item) => {
        const coincideTexto =
          !texto ||
          item.titulo.toLowerCase().includes(texto) ||
          item.descripcion?.toLowerCase().includes(texto) ||
          item.categoria.toLowerCase().includes(texto) ||
          item.ubicacion?.toLowerCase().includes(texto);

        const coincideCategoria =
          categoriaActiva === "Todas" || item.categoria === categoriaActiva;

        return coincideTexto && coincideCategoria;
      })
      .map((item) => {
        let distanciaCalculada: number | null = null;

        if (
          latUsuario !== null &&
          lonUsuario !== null &&
          item.latitud !== null &&
          item.longitud !== null
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

    if (soloDisponibles) {
      lista = lista.filter((item) => item.disponible);
    }

    if (ordenCercania) {
      lista = lista.sort((a, b) => {
        if (a.distanciaCalculada === null && b.distanciaCalculada === null) {
          return 0;
        }
        if (a.distanciaCalculada === null) return 1;
        if (b.distanciaCalculada === null) return -1;
        return a.distanciaCalculada - b.distanciaCalculada;
      });
    }

    return lista;
  }, [
    publicaciones,
    busqueda,
    categoriaActiva,
    soloDisponibles,
    ordenCercania,
    latUsuario,
    lonUsuario,
  ]);

  const crearLinkWhatsApp = (telefono: string, titulo: string) => {
    const mensaje = `Hola, vi tu publicación en la app. Me interesa "${titulo}". ¿Sigue disponible?`;
    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  };

  return (
    <main className="min-h-screen bg-[#eef2f5] flex justify-center">
      <div className="w-full max-w-sm min-h-screen bg-[#eef2f5] pb-24">
        <div className="bg-blue-600 text-white rounded-b-3xl px-4 pt-6 pb-5 shadow-md">
          <div className="flex items-center justify-between text-sm mb-4">
            <Link
              href="/"
              className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium"
            >
              ←
            </Link>
            <span>🔎</span>
          </div>

          <h1 className="text-2xl font-bold text-center">Buscar</h1>
          <p className="text-center text-sm text-blue-100 mt-2">
            Busca entre todas las publicaciones
          </p>

          <div className="mt-4 bg-white rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
            <span className="text-gray-400">🔍</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full outline-none text-gray-700 placeholder:text-gray-400"
              placeholder="¿Qué necesitas hoy?"
              autoFocus
            />
            {busqueda ? (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="text-gray-400 text-sm"
              >
                ✕
              </button>
            ) : (
              <span className="text-gray-400">🎤</span>
            )}
          </div>
        </div>

        <section className="px-4 mt-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categoriasDisponibles.map((categoria) => (
              <button
                key={categoria}
                type="button"
                onClick={() => setCategoriaActiva(categoria)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                  categoriaActiva === categoria
                    ? "bg-blue-600 text-white"
                    : "border bg-white text-gray-700"
                }`}
              >
                {categoria}
              </button>
            ))}
          </div>
        </section>

        <section className="px-4 mt-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setOrdenCercania(!ordenCercania)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                ordenCercania
                  ? "bg-blue-600 text-white"
                  : "border bg-white text-gray-700"
              }`}
            >
              📍 Más cercanos
            </button>

            <button
              type="button"
              onClick={() => setSoloDisponibles(!soloDisponibles)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                soloDisponibles
                  ? "bg-green-600 text-white"
                  : "border bg-white text-gray-700"
              }`}
            >
              ✅ Solo disponibles
            </button>
          </div>
        </section>

        <section className="px-4 mt-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Resultados</h2>
              <p className="text-sm text-gray-500">
                {resultados.length} publicación{resultados.length === 1 ? "" : "es"}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {mensaje ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">{mensaje}</p>
              </div>
            ) : resultados.length === 0 ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">
                  No se encontraron publicaciones con esa búsqueda.
                </p>
              </div>
            ) : (
              resultados.map((item) => (
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
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/publicacion/${item.id}`}
                          className="font-semibold text-sm text-gray-900 truncate hover:underline"
                        >
                          {item.titulo}
                        </Link>

                        <span className="text-[10px] rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                          {item.categoria}
                        </span>
                      </div>

                      {item.descripcion && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {item.descripcion}
                        </p>
                      )}

                      <p className="text-xs text-blue-700 font-medium mt-1">
                        {item.precio || "Sin precio"}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {item.ubicacion || "Ubicación no indicada"}
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

                    <FavoriteButton publicacionId={item.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none">
          <div className="w-full max-w-sm bg-white border-t border-gray-200 rounded-t-3xl px-6 py-3 shadow-lg pointer-events-auto">
            <div className="flex items-end justify-between text-xs text-gray-500">
              <Link href="/" className="flex flex-col items-center">
                <span className="text-xl">🏠</span>
                <span>Inicio</span>
              </Link>

              <Link
                href="/buscar"
                className="flex flex-col items-center text-blue-600 font-medium"
              >
                <span className="text-xl">🔍</span>
                <span>Buscar</span>
              </Link>

              <Link href="/publicar" className="flex flex-col items-center -mt-8">
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