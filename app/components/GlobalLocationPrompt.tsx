"use client";

import { useMemo, useState } from "react";
import { useUserLocation } from "./useUserLocation";

function formatearFechaUbicacion(fechaIso: string | null) {
  if (!fechaIso) return null;

  const fecha = new Date(fechaIso);

  return fecha.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GlobalLocationPrompt() {
  const {
    ubicacionActiva,
    ubicacionActualizada,
    pedirUbicacion,
    actualizarUbicacion,
    borrarUbicacionGuardada,
    cargandoUbicacion,
    errorUbicacion,
    estadoPermiso,
  } = useUserLocation();

  const [minimizado, setMinimizado] = useState(false);

  const bloqueado = estadoPermiso === "bloqueado";

  const fechaTexto = useMemo(
    () => formatearFechaUbicacion(ubicacionActualizada),
    [ubicacionActualizada]
  );

  if (minimizado) {
    return (
      <button
        type="button"
        onClick={() => setMinimizado(false)}
        className="fixed right-4 bottom-24 z-[9999] rounded-full bg-blue-600 text-white shadow-xl px-4 py-3 text-sm font-semibold"
      >
        📍
      </button>
    );
  }

  return (
    <div className="fixed left-3 right-3 bottom-24 z-[9999] flex justify-center pointer-events-none">
      <div className="w-full max-w-sm bg-white border border-blue-100 rounded-3xl shadow-xl p-4 pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-xl">
            📍
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {ubicacionActiva
                    ? "Ubicación activada"
                    : "Activa tu ubicación"}
                </h3>

                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {ubicacionActiva
                    ? "Te mostramos lo que está más cerca de ti."
                    : "Activa tu ubicación para ver publicaciones cercanas."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMinimizado(true)}
                className="text-gray-400 text-lg leading-none"
                aria-label="Minimizar"
              >
                ×
              </button>
            </div>

            {ubicacionActiva && fechaTexto && (
              <p className="mt-2 text-xs text-green-700 font-medium">
                Última actualización: {fechaTexto}
              </p>
            )}

            {bloqueado && (
              <div className="mt-3 rounded-2xl bg-orange-50 border border-orange-100 p-3">
                <p className="text-xs font-semibold text-orange-800">
                  La ubicación está bloqueada.
                </p>
                <p className="text-xs text-orange-800 mt-1 leading-relaxed">
                  Toca el candado junto al link, entra a permisos y cambia
                  ubicación a “Permitir”. Luego vuelve y toca intentar.
                </p>
              </div>
            )}

            {errorUbicacion && !bloqueado && (
              <p className="text-xs text-red-600 mt-2">{errorUbicacion}</p>
            )}

            {!ubicacionActiva ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={pedirUbicacion}
                  disabled={cargandoUbicacion}
                  className="rounded-2xl bg-blue-600 text-white text-xs font-semibold px-3 py-3 disabled:bg-blue-300"
                >
                  {cargandoUbicacion ? "Activando..." : "Activar ubicación"}
                </button>

                <button
                  type="button"
                  onClick={() => setMinimizado(true)}
                  className="rounded-2xl bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-3"
                >
                  Usar sin ubicación
                </button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={actualizarUbicacion}
                  disabled={cargandoUbicacion}
                  className="rounded-2xl bg-blue-600 text-white text-xs font-semibold px-3 py-3 disabled:bg-blue-300"
                >
                  {cargandoUbicacion
                    ? "Actualizando..."
                    : "Actualizar ubicación"}
                </button>

                <button
                  type="button"
                  onClick={borrarUbicacionGuardada}
                  className="rounded-2xl bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-3"
                >
                  Cambiar ubicación
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}