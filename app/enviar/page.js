'use client'
import { useEffect, useState } from "react";
import { db, auth } from "@/firebase/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function EnviarPage() {
  const [texto, setTexto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuario) => {
      if (usuario) {
        setUser(usuario);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const enviarAporte = async () => {
    if (!user || !texto.trim()) {
      alert("Debes escribir algo o pegar un enlace válido.");
      return;
    }

    const link = texto.trim();
    const esYoutube = /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(link);
    const esImagen = /\.(jpg|jpeg|png|gif|webp)$/i.test(link);
    const esTextoNormal = !esYoutube && !esImagen && link.length > 5;

    if (!esYoutube && !esImagen && !esTextoNormal) {
      alert("Por favor, escribe algo o pega un enlace válido (YouTube o imagen).");
      return;
    }

    try {
      // Obtener nombreUsuario desde Firestore
      const userRef = doc(db, "usuarios", user.uid);
      const userSnap = await getDoc(userRef);

      let nombreAutor = user.email; // fallback
      if (userSnap.exists()) {
        const userData = userSnap.data();
        nombreAutor = userData.nombreUsuario || user.email;
      }

      await addDoc(collection(db, "aportes"), {
        texto: link,
        autor: nombreAutor,
        aprobado: false,
        creadoEn: serverTimestamp()
      });

      setTexto("");
      setMensaje("Gracias por tu aporte. Un mono lo revisará y decidirá si es digno 🐒");
    } catch (e) {
      console.error("Error al enviar el aporte:", e);
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <>
      <Header />
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
        <h2 className="text-xl font-bold mb-2">Enviar aporte</h2>
        <textarea
          rows={5}
          placeholder="Escribe tu aporte aquí..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          style={{ width: "100%", padding: 10 }}
        />
        <button
          onClick={enviarAporte}
          style={{
            marginTop: 10,
            padding: "10px 20px",
            backgroundColor: "black",
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
        >
          Enviar
        </button>
        {mensaje && (
          <p style={{
            marginTop: 20,
            backgroundColor: "#222",
            color: "#fff",
            padding: 10,
            borderRadius: 4
          }}>
            {mensaje}
          </p>
        )}
      </div>
    </>
  );
}
