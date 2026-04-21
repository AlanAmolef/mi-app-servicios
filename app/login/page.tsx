"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const router = useRouter();

  const login = async () => {
    setMensaje("Probando inicio de sesión...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("LOGIN ERROR:\n" + error.message);
      setMensaje("Error al iniciar sesión: " + error.message);
      return;
    }

    setMensaje("Sesión iniciada correctamente");
    router.push("/");
  };

  const register = async () => {
    setMensaje("Probando registro...");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert("REGISTER ERROR:\n" + error.message);
      setMensaje("Error al registrarse: " + error.message);
      return;
    }

    alert("Cuenta creada correctamente");
    setMensaje("Cuenta creada correctamente");
  };

  return (
    <main className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="w-full max-w-sm p-4 space-y-4 bg-white rounded-2xl shadow">
        <h1 className="text-xl font-bold text-center">
          Iniciar sesión
        </h1>

        <input
          placeholder="Correo"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full bg-blue-600 text-white p-3 rounded"
        >
          Ingresar
        </button>

        <button
          onClick={register}
          className="w-full bg-gray-600 text-white p-3 rounded"
        >
          Registrarse
        </button>

        {mensaje && (
          <p className="text-sm text-center text-gray-700">
            {mensaje}
          </p>
        )}
      </div>
    </main>
  );
}