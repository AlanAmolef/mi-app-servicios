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

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Publicacion[]>([]);
  const [mensaje, setMensaje] = useState("Cargando servicios...");
  const { latUsuario, lonUsuario, pedirUbicacion } = useUserLocation();

  const [busqueda, setBusqueda] = useState("");
  const [ordenCercania, setOrdenCercania] = useState(true);
  const [soloDisponibles, setSoloDisponibles] = useState(false);

  useEffect(() => {
    const cargarServicios = async () => {
      const { data, error } = await supabase
        .from("publicaciones")
        .select("*")
        .eq("categoria", "Servicios")
        .order("id", { ascending: false });

      if (error) {
        setMensaje("Error al cargar servicios");
        return;
      }

      setServicios(data || []);
      setMensaje("");
    };

    cargarServicios();
  }, []);

  const serviciosProcesados: PublicacionConDistancia[] = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    let lista = servicios
      .filter((servicio) => {
        if (!texto) return true;

        return (
          servicio.titulo.toLowerCase().includes(texto) ||
          servicio.descripcion?.toLowerCase().includes(texto) ||
          servicio.ubicacion?.toLowerCase().includes(texto)
        );
      })
      .map((servicio) => {
        let distanciaCalculada: number | null = null;

        if (
          latUsuario !== null &&
          lonUsuario !== null &&
          servicio.latitud !== null &&
          servicio.longitud !== null
        ) {
          distanciaCalculada = calcularDistanciaEnMetros(
            latUsuario,
            lonUsuario,
            servicio.latitud,
            servicio.longitud
          );
        }

        return { ...servicio, distanciaCalculada };
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
    servicios,
    latUsuario,
    lonUsuario,
    busqueda,
    soloDisponibles,
    ordenCercania,
  ]);

  const crearLinkWhatsApp = (telefono: string, titulo: string) => {
    const mensaje = `Hola, vi tu publicación en la app. Me interesa "${titulo}". ¿Sigue disponible?`;
    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  };

  return (
    <main className="min-h-screen bg-[#eef2f5] flex justify-center">
      <div className="w-full max-w-sm min-h-screen bg-[#eef2f5] pb-28">
        <div className="bg-slate-600 text-white rounded-b-3xl px-4 pt-6 pb-5 shadow-md">
          <div className="flex items-center justify-start text-sm mb-4">
            <Link
              href="/"
              className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium"
            >
              ←
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-center">Servicios</h1>

          <div className="mt-4 bg-white rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
            <span className="text-gray-400">🔍</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onFocus={pedirUbicacion}
              className="w-full outline-none text-gray-700 placeholder:text-gray-400"
              placeholder="Buscar servicios..."
            />
            <span className="text-gray-400">⚙️</span>
          </div>
        </div>

        <section className="px-4 mt-5">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            Servicios disponibles cerca de ti
          </h2>

          <div className="grid grid-cols-4 gap-3">
            {[
              { nombre: "Gasfiter", icono: "🛠️" },
              { nombre: "Electricista", icono: "💡" },
              { nombre: "Aseo", icono: "🧼" },
              { nombre: "Cerrajero", icono: "🔑" },
              { nombre: "Maestro", icono: "👷" },
              { nombre: "Pasear Perros", icono: "🐶" },
              { nombre: "Pintor", icono: "🎨" },
              { nombre: "Fletes", icono: "🚚" },
              { nombre: "Jardinería", icono: "🌱" },
              { nombre: "Belleza", icono: "💄" },
              { nombre: "Computación", icono: "💻" },
              { nombre: "Mecánico", icono: "🔧" },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-3 shadow-sm flex flex-col items-center justify-center text-center border border-gray-100"
              >
                <div className="text-2xl mb-1">{item.icono}</div>
                <p className="text-[11px] text-gray-700 font-medium leading-tight">
                  {item.nombre}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 mt-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setOrdenCercania(!ordenCercania)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                ordenCercania
                  ? "bg-slate-600 text-white"
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
              ✅ Disponible ahora
            </button>
          </div>
        </section>

        <section className="px-4 mt-5">
          <div className="mt-3 space-y-3">
            {mensaje ? (
              <p className="text-sm text-gray-500">{mensaje}</p>
            ) : serviciosProcesados.length === 0 ? (
              <p className="text-sm text-gray-500">No hay resultados.</p>
            ) : (
              serviciosProcesados.map((servicio) => (
                <div
                  key={servicio.id}
                  className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200"
                >
                  <div className="flex gap-3">
                    <Link
                      href={`/publicacion/${servicio.id}`}
                      onClick={pedirUbicacion}
                      className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 block shrink-0"
                    >
                      {servicio.imagen_url ? (
                        <img
                          src={servicio.imagen_url}
                          className="w-full h-full object-cover"
                          alt={servicio.titulo}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-2xl">
                          🛠️
                        </div>
                      )}
                    </Link>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/publicacion/${servicio.id}`}
                        onClick={pedirUbicacion}
                        className="font-semibold text-sm text-gray-900 hover:underline block truncate"
                      >
                        {servicio.titulo}
                      </Link>

                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {servicio.descripcion}
                      </p>

                      <p className="text-xs text-slate-600 mt-1">
                        {servicio.precio || "Sin precio"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {servicio.ubicacion || "Ubicación no indicada"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {formatearDistancia(servicio.distanciaCalculada)}
                      </p>

                      <p
                        className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-medium ${
                          servicio.disponible
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {servicio.disponible
                          ? "Disponible ahora"
                          : "No disponible"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={crearLinkWhatsApp(
                        servicio.telefono,
                        servicio.titulo
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={pedirUbicacion}
                      className="bg-green-600 text-white text-sm py-2 rounded-xl text-center"
                    >
                      Contactar
                    </a>

                    <FavoriteButton publicacionId={servicio.id} />
                  </div>
                </div>
              ))
            )}
          </div>
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
                className="flex flex-col items-center text-slate-600"
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
                className="flex flex-col items-center"
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
  );
}