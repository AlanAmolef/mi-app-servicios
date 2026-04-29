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
  const [ubicacionActualizada, setUbicacionActualizada] = useState<string | null>(
    null
  );
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);
  const [estadoPermiso, setEstadoPermiso] =
    useState<EstadoPermiso>("desconocido");

  const cargarUbicacionGuardada = useCallback(() => {
    const latGuardada = localStorage.getItem(LAT_KEY);
    const lonGuardada = localStorage.getItem(LON_KEY);
    const fechaGuardada = localStorage.getItem(UPDATED_AT_KEY);

    if (latGuardada && lonGuardada) {
      setLatUsuario(Number(latGuardada));
      setLonUsuario(Number(lonGuardada));
      setUbicacionActualizada(fechaGuardada);
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

  const pedirUbicacion = () => {
    setErrorUbicacion(null);

    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no permite usar ubicación.");
      return;
    }

    setCargandoUbicacion(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        guardarUbicacion(position.coords.latitude, position.coords.longitude);
        setCargandoUbicacion(false);
      },
      (error) => {
        setCargandoUbicacion(false);

        if (error.code === error.PERMISSION_DENIED) {
          setEstadoPermiso("bloqueado");
          setErrorUbicacion(
            "La ubicación está bloqueada. Debes permitirla en el navegador."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorUbicacion(
            "No se pudo obtener tu ubicación. Revisa que el GPS esté activado."
          );
        } else if (error.code === error.TIMEOUT) {
          setErrorUbicacion(
            "La ubicación tardó demasiado. Intenta nuevamente."
          );
        } else {
          setErrorUbicacion(
            "No se pudo obtener tu ubicación. Intenta nuevamente."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
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