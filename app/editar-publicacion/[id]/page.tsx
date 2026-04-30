"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Cropper from "react-easy-crop";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "../../components/AuthGuard";
import UserNavButton from "../../components/UserNavButton";
import { useUserLocation } from "../../components/useUserLocation";

type Area = {
  width: number;
  height: number;
  x: number;
  y: number;
};

async function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No se pudo crear el canvas");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("No se pudo generar la imagen recortada"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.92);
  });
}

export default function EditarPublicacionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { pedirUbicacion } = useUserLocation();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [telefono, setTelefono] = useState("+569");
  const [categoria, setCategoria] = useState("Servicios");
  const [ubicacion, setUbicacion] = useState("");
  const [diasAtencion, setDiasAtencion] = useState("");
  const [horarioAtencion, setHorarioAtencion] = useState("");
  const [disponible, setDisponible] = useState(true);

  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [ubicacionObtenida, setUbicacionObtenida] = useState(false);

  const [mensaje, setMensaje] = useState("Cargando publicación...");
  const [userId, setUserId] = useState<string | null>(null);

  const [imagenActualUrl, setImagenActualUrl] = useState<string>("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const aspect = useMemo(() => 1, []);

  const onCropComplete = useCallback(
    (_croppedArea: unknown, croppedAreaPixelsValue: Area) => {
      setCroppedAreaPixels(croppedAreaPixelsValue);
    },
    []
  );

  useEffect(() => {
    const cargarPublicacion = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMensaje("Debes iniciar sesión");
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("publicaciones")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        setMensaje("No se encontró la publicación");
        return;
      }

      setTitulo(data.titulo || "");
      setDescripcion(data.descripcion || "");
      setPrecio(data.precio || "");
      setTelefono(data.telefono || "+569");
      setCategoria(data.categoria || "Servicios");
      setUbicacion(data.ubicacion || "");
      setDiasAtencion(data.dias_atencion || "");
      setHorarioAtencion(data.horario_atencion || "");
      setDisponible(data.disponible ?? true);
      setLatitud(data.latitud ?? null);
      setLongitud(data.longitud ?? null);
      setUbicacionObtenida(data.latitud !== null && data.longitud !== null);
      setImagenActualUrl(data.imagen_url || "");
      setMensaje("");
    };

    if (id) {
      cargarPublicacion();
    }
  }, [id]);

  const manejarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setMensaje("");
  };

  const aplicarRecorte = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setMensaje("Primero selecciona una imagen");
      return;
    }

    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedBlob(blob);

      const previewUrl = URL.createObjectURL(blob);
      setCroppedPreview(previewUrl);

      setMensaje("Imagen recortada lista");
    } catch {
      setMensaje("Error al recortar la imagen");
    }
  };

  const usarUbicacionActual = () => {
    if (!navigator.geolocation) {
      setMensaje("Tu navegador no permite geolocalización");
      return;
    }

    setMensaje("Obteniendo ubicación...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitud(position.coords.latitude);
        setLongitud(position.coords.longitude);
        setUbicacionObtenida(true);
        setMensaje("Ubicación obtenida correctamente");
      },
      () => {
        setUbicacionObtenida(false);
        setMensaje("No se pudo obtener la ubicación");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const normalizarTelefono = (valor: string) => {
    const soloPermitidos = valor.replace(/[^\d+]/g, "");
    if (!soloPermitidos.startsWith("+569")) {
      if (soloPermitidos.startsWith("+56")) return "+569";
      if (soloPermitidos.startsWith("+5")) return "+569";
      if (soloPermitidos.startsWith("+")) return "+569";
      if (soloPermitidos.startsWith("569")) return "+569";
      if (soloPermitidos.startsWith("9")) return "+569" + soloPermitidos.slice(1);
      return "+569";
    }

    const resto = soloPermitidos.slice(4).replace(/\D/g, "").slice(0, 8);
    return `+569${resto}`;
  };

  const manejarTelefono = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = normalizarTelefono(e.target.value);
    setTelefono(valor);
  };

  const telefonoEsValido = (valor: string) => /^\+569\d{8}$/.test(valor);

  const validarFormulario = () => {
    const tituloLimpio = titulo.trim();
    const descripcionLimpia = descripcion.trim();
    const ubicacionLimpia = ubicacion.trim();
    const diasAtencionLimpios = diasAtencion.trim();
    const horarioAtencionLimpio = horarioAtencion.trim();

    if (!tituloLimpio) {
      return "Debes escribir un título";
    }

    if (tituloLimpio.length < 4) {
      return "El título debe tener al menos 4 caracteres";
    }

    if (!descripcionLimpia) {
      return "Debes escribir una descripción";
    }

    if (descripcionLimpia.length < 8) {
      return "La descripción debe tener al menos 8 caracteres";
    }

    if (!telefonoEsValido(telefono)) {
      return "El teléfono debe tener formato +569XXXXXXXX";
    }

    if (!categoria.trim()) {
      return "Debes seleccionar una categoría";
    }

    const tieneImagen = !!imagenActualUrl || !!croppedBlob;
    if (!tieneImagen) {
      return "Debes tener una imagen en la publicación";
    }

    if (!ubicacionLimpia) {
      return "Debes escribir una ubicación visible para los usuarios";
    }

    if (!ubicacionObtenida || latitud === null || longitud === null) {
      return "Debes usar tu ubicación actual para guardar";
    }

    if (!diasAtencionLimpios) {
      return "Debes escribir los días de atención";
    }

    if (!horarioAtencionLimpio) {
      return "Debes escribir el horario de atención";
    }

    return null;
  };

  const guardarCambios = async () => {
    if (!userId) {
      setMensaje("Debes iniciar sesión");
      return;
    }

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setMensaje(errorValidacion);
      return;
    }

    setMensaje("Guardando cambios...");

    let imagenUrlFinal = imagenActualUrl;

    if (croppedBlob) {
      const fileName = `${userId}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("publicaciones")
        .upload(fileName, croppedBlob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        setMensaje("Error al subir la imagen: " + uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("publicaciones")
        .getPublicUrl(fileName);

      imagenUrlFinal = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from("publicaciones")
      .update({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: precio.trim(),
        telefono,
        categoria,
        ubicacion: ubicacion.trim(),
        dias_atencion: diasAtencion.trim(),
        horario_atencion: horarioAtencion.trim(),
        disponible,
        imagen_url: imagenUrlFinal,
        latitud,
        longitud,
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      alert("Error al actualizar: " + error.message);
      setMensaje("Error al actualizar");
      return;
    }

    setMensaje("Cambios guardados correctamente");
    router.push("/mis-publicaciones");
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#eef2f5] flex justify-center">
        <div className="w-full max-w-sm min-h-screen bg-[#eef2f5] pb-24">
          <div className="bg-slate-600 text-white rounded-b-3xl px-4 pt-6 pb-5 shadow-md">
            <div className="flex items-center justify-between text-sm mb-4">
              <Link
                href="/mis-publicaciones"
                className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium"
              >
                ←
              </Link>
              <span>✏️</span>
            </div>

            <h1 className="text-2xl font-bold text-center">
              Editar publicación
            </h1>

            <p className="text-center text-sm text-slate-100 mt-2">
              Modifica la información de tu publicación
            </p>
          </div>

          <section className="px-4 mt-5 space-y-4">
            {mensaje === "Cargando publicación..." ? (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">{mensaje}</p>
              </div>
            ) : (
              <>
                <input
                  className="w-full border p-3 rounded-xl bg-white"
                  placeholder="Título"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />

                <textarea
                  className="w-full border p-3 rounded-xl bg-white"
                  placeholder="Descripción"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />

                <input
                  className="w-full border p-3 rounded-xl bg-white"
                  placeholder="Precio"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                />

                <input
                  className="w-full border p-3 rounded-xl bg-white"
                  placeholder="+56912345678"
                  value={telefono}
                  onChange={manejarTelefono}
                />

                <input
                  className="w-full border p-3 rounded-xl bg-white"
                  placeholder="Ubicación visible para los usuarios"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                />

                <input
                  className="w-full border p-3 rounded-xl bg-white"
                  placeholder="Días de atención. Ej: Lun a Sáb"
                  value={diasAtencion}
                  onChange={(e) => setDiasAtencion(e.target.value)}
                />

                <input
                  className="w-full border p-3 rounded-xl bg-white"
                  placeholder="Horario de atención. Ej: 09:00 - 18:00"
                  value={horarioAtencion}
                  onChange={(e) => setHorarioAtencion(e.target.value)}
                />

                <button
                  type="button"
                  onClick={usarUbicacionActual}
                  className="w-full bg-gray-700 text-white p-3 rounded-xl"
                >
                  Usar mi ubicación actual
                </button>

                {ubicacionObtenida && (
                  <div className="bg-white border rounded-xl p-3 text-sm text-green-700">
                    Ubicación exacta registrada correctamente
                  </div>
                )}

                <select
                  className="w-full border p-3 rounded-xl bg-white"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <option>Servicios</option>
                  <option>Comida</option>
                  <option>Arriendos</option>
                  <option>Avisos</option>
                </select>

                <label className="flex items-center gap-2 bg-white border rounded-xl p-3">
                  <input
                    type="checkbox"
                    checked={disponible}
                    onChange={(e) => setDisponible(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Disponible</span>
                </label>

                {imagenActualUrl && !croppedPreview && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Imagen actual</p>
                    <img
                      src={imagenActualUrl}
                      alt="Imagen actual"
                      className="w-full rounded border bg-white object-cover"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Reemplazar imagen
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={manejarArchivo}
                    className="w-full border p-2 rounded bg-white"
                  />
                </div>

                {imageSrc && (
                  <div className="space-y-3">
                    <div className="relative h-72 w-full overflow-hidden rounded bg-black">
                      <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm">Zoom</label>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={aplicarRecorte}
                      className="w-full bg-gray-700 text-white p-3 rounded-xl"
                    >
                      Aplicar recorte
                    </button>
                  </div>
                )}

                {croppedPreview && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Nueva vista previa</p>
                    <img
                      src={croppedPreview}
                      alt="Vista previa recortada"
                      className="w-full rounded border bg-white object-cover"
                    />
                  </div>
                )}

                <button
                  onClick={guardarCambios}
                  className="w-full rounded-xl bg-slate-600 text-white py-3 font-medium"
                >
                  Guardar cambios
                </button>

                {mensaje && mensaje !== "Cargando publicación..." && (
                  <p className="text-sm text-gray-600">{mensaje}</p>
                )}
              </>
            )}
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
                  className="flex flex-col items-center"
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
    </AuthGuard>
  );
}