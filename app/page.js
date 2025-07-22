'use client'
import { useEffect, useState } from "react";
import { db, auth } from "@/firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Header from "@/components/Header";
import Comentarios from "@/components/Comentarios";

export default function HomePage() {
  const [aportes, setAportes] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "aportes"),
      where("aprobado", "==", true),
      orderBy("creadoEn", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const aprobados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAportes(aprobados);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsAdmin(userData.role === "admin");
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const desaprobarAporte = async (id) => {
    try {
      await updateDoc(doc(db, "aportes", id), { aprobado: false });
      console.log("Aporte desmarcado");
    } catch (error) {
      console.error("Error al desmarcar el aporte:", error);
    }
  };

  const renderAporte = (texto) => {
    if (!texto || typeof texto !== "string") return null;

    const youtubeRegex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]{11})/;
    const imagenRegex = /\.(jpg|jpeg|png|gif|webp)$/i;

    const youtubeMatch = texto.match(youtubeRegex);
    const esImagen = imagenRegex.test(texto);

    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return (
        <iframe
          width="100%"
          height="315"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video"
          frameBorder="0"
          allowFullScreen
        ></iframe>
      );
    }

    if (esImagen) {
      return (
        <img
          src={texto}
          alt="Aporte visual"
          style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain" }}
        />
      );
    }

    return <p>{texto}</p>;
  };

  return (
    <>
      <Header />
      <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
        <h1 className="text-2xl font-bold mb-4">Aportes aprobados</h1>
        {aportes.length === 0 && <p>Aún no hay aportes aprobados.</p>}
        {aportes.map((aporte) => (
          <div key={aporte.id} style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
            <p className="text-sm text-gray-500 mb-2">
              <strong>{aporte.autor}</strong>:
            </p>
            {renderAporte(aporte.texto)}

            {isAdmin && (
              <button
                onClick={() => desaprobarAporte(aporte.id)}
                style={{
                  marginTop: 10,
                  padding: "4px 8px",
                  fontSize: "0.9rem",
                  background: "#f87171",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer"
                }}
              >
                Quitar
              </button>
            )}

            <Comentarios aporteId={aporte.id} />
          </div>
        ))}
      </div>
    </>
  );
}
