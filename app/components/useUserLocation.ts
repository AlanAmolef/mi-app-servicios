"use client";

import { useEffect, useState } from "react";

const LAT_KEY = "app_lat_usuario";
const LON_KEY = "app_lon_usuario";

export function useUserLocation() {
  const [latUsuario, setLatUsuario] = useState<number | null>(null);
  const [lonUsuario, setLonUsuario] = useState<number | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState<string | null>(null);

  const guardarUbicacion = (lat: number, lon: number) => {
    localStorage.setItem(LAT_KEY, String(lat));
    localStorage.setItem(LON_KEY, String(lon));
    setLatUsuario(lat);
    setLonUsuario(lon);
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
          setErrorUbicacion(
            "La ubicación está bloqueada. Actívala en los permisos del navegador."
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

  useEffect(() => {
    const latGuardada = localStorage.getItem(LAT_KEY);
    const lonGuardada = localStorage.getItem(LON_KEY);

    if (latGuardada && lonGuardada) {
      setLatUsuario(Number(latGuardada));
      setLonUsuario(Number(lonGuardada));
    }
  }, []);

  return {
    latUsuario,
    lonUsuario,
    pedirUbicacion,
    cargandoUbicacion,
    errorUbicacion,
  };
}