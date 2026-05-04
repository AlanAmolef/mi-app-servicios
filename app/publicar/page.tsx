"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import AuthGuard from "../components/AuthGuard";
import { supabase } from "@/lib/supabase";

type Area = {
  width: number;
  height: number;
  x: number;
  y: number;
};

const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

const capitalizarPrimeraLetra = (texto: string) => {
  const limpio = texto.trim();
  if (!limpio) return "";
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
};

const normalizarDescripcion = (texto: string) => {
  const limpio = capitalizarPrimeraLetra(texto);
  if (!limpio) return "";
  return /[.!?]$/.test(limpio) ? limpio : `${limpio}.`;
};

const formatearPrecio = (valor: number) => {
  return `$${valor.toLocaleString("es-CL")}`;
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

export default function PublicarPage() {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [telefono, setTelefono] = useState("+569");
  const [categoria, setCategoria] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [diasAtencion, setDiasAtencion] = useState<string[]>([]);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaCierre, setHoraCierre] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [publicadoOk, setPublicadoOk] = useState(false);
  const [publicacionCreadaId, setPublicacionCreadaId] = useState<number | null>(null);

  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [ubicacionObtenida, setUbicacionObtenida] = useState(false);

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

  const limpiarFormulario = () => {
    setTitulo("");
    setDescripcion("");
    setPrecio("");
    setTelefono("+569");
    setCategoria("");
    setUbicacion("");
    setDiasAtencion([]);
    setHoraInicio("");
    setHoraCierre("");
    setLatitud(null);
    setLongitud(null);
    setUbicacionObtenida(false);
    setImageSrc(null);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setMensaje("");
    setPublicadoOk(false);
    setPublicacionCreadaId(null);
  };

  const manejarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setMensaje("");
    setPublicadoOk(false);
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

  const manejarPrecio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const soloNumeros = e.target.value.replace(/\D/g, "");
    const numero = Number(soloNumeros);

    if (!soloNumeros) {
      setPrecio("");
      return;
    }

    if (numero > 1000000000) {
      setPrecio("1000000000");
      return;
    }

    setPrecio(String(numero));
  };

  const alternarDia = (dia: string) => {
    setDiasAtencion((actuales) =>
      actuales.includes(dia)
        ? actuales.filter((d) => d !== dia)
        : [...actuales, dia]
    );
  };

  const telefonoEsValido = (valor: string) => /^\+569\d{8}$/.test(valor);

  const validarFormulario = () => {
    const tituloLimpio = titulo.trim();
    const descripcionLimpia = descripcion.trim();
    const ubicacionLimpia = ubicacion.trim();
    const precioNumero = Number(precio);

    if (!tituloLimpio) return "Debes escribir un título";
    if (tituloLimpio.length < 4) return "El título debe tener al menos 4 caracteres";
    if (!descripcionLimpia) return "Debes escribir una descripción";
    if (descripcionLimpia.length < 8) return "La descripción debe tener al menos 8 caracteres";
    if (!precio || !Number.isInteger(precioNumero) || precioNumero < 1 || precioNumero > 1000000000) {
      return "El precio debe ser un número entero entre 1 y 1.000.000.000";
    }
    if (!telefonoEsValido(telefono)) return "El teléfono debe tener formato +569XXXXXXXX";
    if (!categoria.trim()) return "Debes seleccionar una categoría";
    if (!croppedBlob) return "Debes subir una imagen y aplicar el recorte";
    if (!ubicacionLimpia) return "Debes escribir una ubicación visible para los usuarios";
    if (!ubicacionObtenida || latitud === null || longitud === null) return "Debes usar tu ubicación actual para publicar";
    if (diasAtencion.length === 0) return "Debes seleccionar al menos un día de atención";
    if (!horaInicio) return "Debes seleccionar la hora de inicio";
    if (!horaCierre) return "Debes seleccionar la hora de cierre";
    if (horaInicio >= horaCierre) return "La hora de cierre debe ser posterior a la hora de inicio";

    return null;
  };

  const publicar = async () => {
    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setMensaje(errorValidacion);
      setPublicadoOk(false);
      return;
    }

    setMensaje("Guardando...");
    setPublicadoOk(false);
    setPublicacionCreadaId(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMensaje("Debes iniciar sesión para publicar");
      return;
    }

    let imagenUrl = "";

    if (croppedBlob) {
      const fileName = `${user.id}/${Date.now()}.jpg`;

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

      imagenUrl = publicUrlData.publicUrl;
    }

    const precioNumero = Number(precio);
    const tituloFinal = capitalizarPrimeraLetra(titulo);
    const descripcionFinal = normalizarDescripcion(descripcion);
    const horarioFinal = `${horaInicio} - ${horaCierre}`;

    const { data, error } = await supabase
      .from("publicaciones")
      .insert([
        {
          titulo: tituloFinal,
          descripcion: descripcionFinal,
          precio: formatearPrecio(precioNumero),
          precio_numero: precioNumero,
          telefono,
          categoria,
          ubicacion: ubicacion.trim(),
          dias_atencion: diasAtencion,
          horario_atencion: horarioFinal,
          hora_inicio: horaInicio,
          hora_cierre: horaCierre,
          distancia: "",
          disponible: true,
          user_id: user.id,
          imagen_url: imagenUrl,
          latitud,
          longitud,
        },
      ])
      .select("id")
      .single();

    if (error) {
      alert("Error al publicar: " + error.message);
      setMensaje("Error al publicar: " + error.message);
      setPublicadoOk(false);
      return;
    }

    setMensaje("Publicado correctamente");
    setPublicadoOk(true);
    setPublicacionCreadaId(data?.id ?? null);

    setTitulo("");
    setDescripcion("");
    setPrecio("");
    setTelefono("+569");
    setCategoria("");
    setUbicacion("");
    setDiasAtencion([]);
    setHoraInicio("");
    setHoraCierre("");
    setLatitud(null);
    setLongitud(null);
    setUbicacionObtenida(false);
    setImageSrc(null);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-100 flex justify-center">
        <div className="w-full max-w-sm min-h-screen p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="rounded-full bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm"
            >
              ← Inicio
            </Link>

            <h1 className="text-xl font-bold text-gray-900">Crear publicación</h1>

            <div className="w-[72px]" />
          </div>

          {publicadoOk && (
            <div className="bg-white border border-green-200 rounded-2xl p-4 shadow-sm space-y-3">
              <p className="text-sm text-green-700 font-medium">
                La publicación se creó correctamente.
              </p>

              <div className="grid grid-cols-1 gap-2">
                {publicacionCreadaId && (
                  <Link
                    href={`/publicacion/${publicacionCreadaId}`}
                    className="w-full rounded-xl bg-blue-600 text-white py-3 font-medium text-center"
                  >
                    Ver detalle de la publicación
                  </Link>
                )}

                <Link
                  href="/"
                  className="w-full rounded-xl bg-gray-700 text-white py-3 font-medium text-center"
                >
                  Ir al inicio
                </Link>

                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="w-full rounded-xl bg-white border border-gray-300 text-gray-700 py-3 font-medium"
                >
                  Publicar otra
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">Título</label>
            <input
              className="w-full border p-2 rounded bg-white text-gray-900"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">Descripción</label>
            <textarea
              className="w-full border p-2 rounded bg-white text-gray-900"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">Precio</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full border p-2 rounded bg-white text-gray-900"
              value={precio}
              onChange={manejarPrecio}
            />
            <p className="text-xs text-gray-500">
              Solo números. Ejemplo: 10000
            </p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">Teléfono</label>
            <input
              className="w-full border p-2 rounded bg-white text-gray-900"
              value={telefono}
              onChange={manejarTelefono}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-900">
              Ubicación visible para los usuarios
            </label>
            <input
              className="w-full border p-2 rounded bg-white text-gray-900"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Días de atención
            </label>

            <div className="grid grid-cols-2 gap-2">
              {DIAS.map((dia) => (
                <button
                  key={dia}
                  type="button"
                  onClick={() => alternarDia(dia)}
                  className={`rounded-xl border p-3 text-sm font-medium capitalize transition ${
                    diasAtencion.includes(dia)
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                >
                  {dia}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900">
                Hora de inicio
              </label>
              <input
                type="time"
                className="w-full border p-2 rounded bg-white text-gray-900"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-900">
                Hora de cierre
              </label>
              <input
                type="time"
                className="w-full border p-2 rounded bg-white text-gray-900"
                value={horaCierre}
                onChange={(e) => setHoraCierre(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={usarUbicacionActual}
            className="w-full bg-gray-700 text-white p-3 rounded"
          >
            Usar mi ubicación actual
          </button>

          {ubicacionObtenida && (
            <div className="bg-white border rounded p-3 text-sm text-green-700">
              Ubicación exacta registrada correctamente
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Categoría
            </label>

            <div className="grid grid-cols-2 gap-2">
              {["Servicios", "Comida", "Arriendos", "Avisos"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoria(cat)}
                  className={`rounded-xl border p-3 text-sm font-medium transition ${
                    categoria === cat
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">Imagen</label>
            <input
              type="file"
              accept="image/*"
              onChange={manejarArchivo}
              className="w-full border p-2 rounded bg-white text-gray-900"
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
                <label className="block text-sm text-gray-900">Zoom</label>
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
                className="w-full bg-gray-700 text-white p-3 rounded"
              >
                Aplicar recorte
              </button>
            </div>
          )}

          {croppedPreview && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Vista previa</p>
              <img
                src={croppedPreview}
                alt="Vista previa recortada"
                className="w-full rounded border bg-white object-cover"
              />
            </div>
          )}

          <button
            onClick={publicar}
            className="w-full bg-blue-600 text-white p-3 rounded"
          >
            Publicar
          </button>

          {mensaje && !publicadoOk && (
            <p className="text-sm text-gray-700">{mensaje}</p>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}