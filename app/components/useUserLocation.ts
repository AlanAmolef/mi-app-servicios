"use client";

import { useCallback, useEffect, useState } from "react";

const LAT_KEY = "app_lat_usuario";
const LON_KEY = "app_lon_usuario";
const UPDATED_AT_KEY = "app_ubicacion_actualizada";
const LOCATION_EVENT = "app-location-updated";

type EstadoPermiso = "desconocido" | "preguntar" | "permitido" | "bloqueado";

export function useUserLocation() {
  const [latUsuario, setLatUsuario] = useState<number | null>(null);
  const [lonUsuario, setLonUsuario] = useState<number | null>(null);
  const [ubicacionActualizada, setUbicacionActualizada] = useState<string | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [estadoPermiso, setEstadoPermiso] = useState<EstadoPermiso>("desconocido");

  const cargarUbicacionGuardada = useCallback(() => {
    const lat = localStorage.getItem(LAT_KEY);
    const lon = localStorage.getItem(LON_KEY);
    const fecha = localStorage.getItem(UPDATED_AT_KEY);

    if (lat && lon) {
      setLatUsuario(Number(lat));
      setLonUsuario(Number(lon));
      setUbicacionActualizada(fecha);
    }
  }, []);

  const guardarUbicacion = (lat: number, lon: number) => {
    const ahora = new Date().toISOString();

    localStorage.setItem(LAT_KEY, String(lat));
    localStorage.setItem(LON_KEY, String(lon));
    localStorage.setItem(UPDATED_AT_KEY, ahora);

    setLatUsuario(lat);
    setLonUsuario(lon);
    setUbicacionActualizada(ahora);
    setEstadoPermiso("permitido");
    setErrorUbicacion(null);

    window.dispatchEvent(new Event(LOCATION_EVENT));
  };

  const obtenerUbicacion = (altaPrecision: boolean) => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: altaPrecision,
        timeout: altaPrecision ? 20000 : 10000,
        maximumAge: 5 * 60 * 1000,
      });
    });
  };

  const consultarEstadoPermiso = async () => {
    if (!navigator.permissions) return;

    try {
      const permiso = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permiso.state === "granted") setEstadoPermiso("permitido");
      if (permiso.state === "prompt") setEstadoPermiso("preguntar");
      if (permiso.state === "denied") setEstadoPermiso("bloqueado");

      permiso.onchange = () => {
        if (permiso.state === "granted") setEstadoPermiso("permitido");
        if (permiso.state === "prompt") setEstadoPermiso("preguntar");
        if (permiso.state === "denied") setEstadoPermiso("bloqueado");
      };
    } catch {
      setEstadoPermiso("desconocido");
    }
  };

  const pedirUbicacion = async () => {
    setErrorUbicacion(null);

    if (!navigator.geolocation) {
      setErrorUbicacion("Este celular o navegador no permite usar ubicación.");
      return;
    }

    setCargandoUbicacion(true);

    try {
      // Primero intenta una ubicación rápida y simple.
      const posicionRapida = await obtenerUbicacion(false);

      guardarUbicacion(
        posicionRapida.coords.latitude,
        posicionRapida.coords.longitude
      );

      setCargandoUbicacion(false);

      // Después intenta mejorarla en segundo plano.
      obtenerUbicacion(true)
        .then((posicionPrecisa) => {
          guardarUbicacion(
            posicionPrecisa.coords.latitude,
            posicionPrecisa.coords.longitude
          );
        })
        .catch(() => {});
    } catch (error: any) {
      try {
        // Segundo intento, con mayor precisión.
        const posicionPrecisa = await obtenerUbicacion(true);

        guardarUbicacion(
          posicionPrecisa.coords.latitude,
          posicionPrecisa.coords.longitude
        );

        setCargandoUbicacion(false);
      } catch (errorFinal: any) {
        setCargandoUbicacion(false);

        if (errorFinal?.code === 1) {
          setEstadoPermiso("bloqueado");
          setErrorUbicacion(
            "La ubicación está bloqueada. Actívala desde los permisos del navegador."
          );
          return;
        }

        if (errorFinal?.code === 2) {
          setErrorUbicacion(
            "No pudimos detectar tu ubicación. Activa el GPS del celular e intenta nuevamente."
          );
          return;
        }

        if (errorFinal?.code === 3) {
          setErrorUbicacion(
            "La ubicación tardó demasiado. Intenta nuevamente en unos segundos."
          );
          return;
        }

        setErrorUbicacion(
          "No pudimos obtener tu ubicación. Intenta nuevamente."
        );
      }
    }
  };

  const actualizarUbicacion = () => {
    pedirUbicacion();
  };

  const borrarUbicacionGuardada = () => {
    localStorage.removeItem(LAT_KEY);
    localStorage.removeItem(LON_KEY);
    localStorage.removeItem(UPDATED_AT_KEY);

    setLatUsuario(null);
    setLonUsuario(null);
    setUbicacionActualizada(null);

    window.dispatchEvent(new Event(LOCATION_EVENT));
  };

  useEffect(() => {
    cargarUbicacionGuardada();
    consultarEstadoPermiso();

    const actualizar = () => cargarUbicacionGuardada();

    window.addEventListener(LOCATION_EVENT, actualizar);
    window.addEventListener("storage", actualizar);

    return () => {
      window.removeEventListener(LOCATION_EVENT, actualizar);
      window.removeEventListener("storage", actualizar);
    };
  }, [cargarUbicacionGuardada]);

  return {
    latUsuario,
    lonUsuario,
    ubicacionActiva: latUsuario !== null && lonUsuario !== null,
    ubicacionActualizada,
    pedirUbicacion,
    actualizarUbicacion,
    borrarUbicacionGuardada,
    cargandoUbicacion,
    errorUbicacion,
    estadoPermiso,
  };
}