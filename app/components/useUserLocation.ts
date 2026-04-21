"use client";

import { useEffect, useState } from "react";

export function useUserLocation() {
  const [latUsuario, setLatUsuario] = useState<number | null>(null);
  const [lonUsuario, setLonUsuario] = useState<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatUsuario(position.coords.latitude);
        setLonUsuario(position.coords.longitude);
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  return { latUsuario, lonUsuario };
}