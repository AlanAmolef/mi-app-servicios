"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import FavoriteButton from "@/app/components/FavoriteButton";
import { useUserLocation } from "@/app/components/useUserLocation";
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
  dias_atencion: string | null;
  horario_atencion: string | null;
  latitud: number | null;
  longitud: number | null;
};

export default function DetallePublicacionPage() {
  const params = useParams();
  const id = params.id as string;

  const [publicacion, setPublicacion] = useState<Publicacion | null>(null);
  const [mensaje, setMensaje] = useState("Cargando publicación...");
  const [compartiendo, setCompartiendo] = useState(false);

  const { latUsuario, lonUsuario } = useUserLocation();

  useEffect(() => {
    const cargarPublicacion = async () => {
      const { data, error } = await supabase
        .from("publicaciones")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setMensaje("No se encontró la publicación");
        return;
      }

      setPublicacion(data);
      setMensaje("");
    };

    if (id) {
      cargarPublicacion();
    }
  }, [id]);

  const distanciaCalculada = useMemo(() => {
    if (
      !publicacion ||
      latUsuario === null ||
      lonUsuario === null ||
      publicacion.latitud === null ||
      publicacion.longitud === null
    ) {
      return null;
    }

    return calcularDistanciaEnMetros(
      latUsuario,
      lonUsuario,
      publicacion.latitud,
      publicacion.longitud
    );
  }, [publicacion, latUsuario, lonUsuario]);

  const crearLinkWhatsApp = (telefono: string, titulo: string) => {
    const mensaje = `Hola, vi tu publicación en la app. Me interesa "${titulo}". ¿Sigue disponible?`;
    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  };

  const compartirPublicacion = async () => {
    if (!publicacion) return;

    const url = window.location.href;
    const texto = `${publicacion.titulo}${publicacion.precio ? ` - ${publicacion.precio}` : ""}`;

    try {
      setCompartiendo(true);

      if (navigator.share) {
        await navigator.share({
          title: publicacion.titulo,
          text: texto,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Enlace copiado al portapapeles");
      }
    } catch {
      // cancelado o error silencioso
    } finally {
      setCompartiendo(false);
    }
  };

  const volverA = publicacion
    ? `/${publicacion.categoria.toLowerCase()}`
    : "/";

  return (
    <main className="min-h-screen bg-[#eef2f5] flex justify-center">
      <div className="w-full max-w-sm min-h-screen bg-[#eef2f5] pb-24">
        {mensaje ? (
          <div className="p-4">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">{mensaje}</p>
            </div>
          </div>
        ) : publicacion ? (
          <>
            <div className="bg-blue-600 text-white px-4 pt-6 pb-4 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <Link
                  href={volverA}
                  className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium"
                >
                  ←
                </Link>

                <button
                  onClick={compartirPublicacion}
                  disabled={compartiendo}
                  className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium"
                  type="button"
                >
                  {compartiendo ? "..." : "Compartir"}
                </button>
              </div>

              <h1 className="text-xl font-bold text-center truncate">
                {publicacion.categoria}
              </h1>
            </div>

            <div className="w-full bg-white">
              {publicacion.imagen_url ? (
                <img
                  src={publicacion.imagen_url}
                  alt={publicacion.titulo}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-5xl">
                  📦
                </div>
              )}
            </div>

            <section className="px-4 -mt-2 space-y-4 pb-6">
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 leading-tight">
                      {publicacion.titulo}
                    </h2>

                    {publicacion.precio && (
                      <p className="text-3xl font-bold text-green-700 mt-2">
                        {publicacion.precio}
                      </p>
                    )}
                  </div>

                  <span className="text-xs rounded-full bg-gray-100 px-3 py-1 text-gray-600 shrink-0">
                    {publicacion.categoria}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      publicacion.disponible
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {publicacion.disponible ? "Disponible ahora" : "No disponible"}
                  </span>

                  <span className="inline-flex rounded-full px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700">
                    {formatearDistancia(distanciaCalculada)}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Información</h3>

                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span>📍</span>
                    <div>
                      <p className="font-medium">Ubicación</p>
                      <p>{publicacion.ubicacion || "No indicada"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span>📅</span>
                    <div>
                      <p className="font-medium">Días de atención</p>
                      <p>{publicacion.dias_atencion || "No especificado"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span>🕒</span>
                    <div>
                      <p className="font-medium">Horario de atención</p>
                      <p>{publicacion.horario_atencion || "No especificado"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Detalle de la publicación
                </h3>

                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {publicacion.descripcion || "Sin descripción"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={crearLinkWhatsApp(publicacion.telefono, publicacion.titulo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-2xl bg-green-600 text-white text-center py-4 text-lg font-semibold shadow-sm"
                >
                  WhatsApp
                </a>

                <div className="flex items-stretch">
                  <div className="w-full">
                    <FavoriteButton publicacionId={publicacion.id} />
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}