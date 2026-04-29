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
    if (latUsuario !== null && lonUsuario !== null) return;

    if (!navigator.geolocation) {
      setErrorUbicacion("Tu navegador no permite usar ubicación.");
      return;
    }

    setCargandoUbicacion(true);
    setErrorUbicacion(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        guardarUbicacion(position.coords.latitude, position.coords.longitude);
        setCargandoUbicacion(false);
      },
      () => {
        setCargandoUbicacion(false);
        setErrorUbicacion(
          "Activa la ubicación para ver publicaciones cercanas."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
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