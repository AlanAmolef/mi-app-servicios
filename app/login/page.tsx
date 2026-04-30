"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const emailLimpio = email.trim().toLowerCase();

  const validarFormulario = () => {
    if (!emailLimpio) return "Escribe tu correo.";
    if (!emailLimpio.includes("@")) return "Escribe un correo válido.";
    if (!password) return "Escribe tu contraseña.";
    if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    return null;
  };

  const login = async () => {
    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setMensaje(errorValidacion);
      return;
    }

    setCargando(true);
    setMensaje("Iniciando sesión...");

    const { error } = await supabase.auth.signInWithPassword({
      email: emailLimpio,
      password,
    });

    setCargando(false);

    if (error) {
      setMensaje("No se pudo iniciar sesión. Revisa tu correo y contraseña.");
      return;
    }

    setMensaje("Sesión iniciada correctamente.");
    router.push("/");
  };

  const register = async () => {
    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setMensaje(errorValidacion);
      return;
    }

    setCargando(true);
    setMensaje("Creando cuenta...");

    const { error } = await supabase.auth.signUp({
      email: emailLimpio,
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/login`
            : undefined,
      },
    });

    setCargando(false);

    if (error) {
      setMensaje("No se pudo crear la cuenta: " + error.message);
      return;
    }

    setMensaje(
      "Cuenta creada. Revisa tu correo y confirma tu cuenta antes de iniciar sesión."
    );
  };

  return (
    <main className="min-h-screen flex justify-center items-center bg-[#eef2f5] px-4">
      <div className="w-full max-w-sm p-5 space-y-4 bg-white rounded-2xl shadow border border-gray-200">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Iniciar sesión</h1>
          <p className="text-sm text-gray-500 mt-1">
            Entra o crea tu cuenta para publicar y guardar favoritos.
          </p>
        </div>

        <input
          type="email"
          placeholder="Correo"
          className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:border-slate-600"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:border-slate-600"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={cargando}
          className="w-full bg-slate-600 text-white p-3 rounded-xl font-medium disabled:opacity-60"
        >
          {cargando ? "Procesando..." : "Ingresar"}
        </button>

        <button
          onClick={register}
          disabled={cargando}
          className="w-full bg-gray-700 text-white p-3 rounded-xl font-medium disabled:opacity-60"
        >
          Registrarse
        </button>

        {mensaje && (
          <p className="text-sm text-center text-gray-700 leading-relaxed">
            {mensaje}
          </p>
        )}
      </div>
    </main>
  );
}