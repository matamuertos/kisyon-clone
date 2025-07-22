'use client'
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import Header from "@/components/Header";

export default function AdminPage() {
  const [aportes, setAportes] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "aportes"),
      where("aprobado", "==", false),
      orderBy("creadoEn", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nuevos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAportes(nuevos);
    });

    return () => unsubscribe();
  }, []);

  const renderAporte = (texto) => {
    const youtubeMatch = texto.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]{11})/
    );
    const esImagen = texto.match(/\.(jpg|jpeg|png|gif|webp)$/i);

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

  const aprobarAporte = async (id) => {
    try {
      const ref = doc(db, "aportes", id);
      await updateDoc(ref, { aprobado: true });
    } catch (error) {
      console.error("Error al aprobar aporte:", error);
    }
  };

  const eliminarAporte = async (id) => {
    try {
      const ref = doc(db, "aportes", id);
      await deleteDoc(ref);
    } catch (error) {
      console.error("Error al eliminar aporte:", error);
    }
  };

  return (
    <>
      <Header />
      <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
        <h1 className="text-2xl font-bold mb-4">Aportes pendientes</h1>
        {aportes.length === 0 && <p>No hay aportes pendientes.</p>}
        {aportes.map((aporte) => (
          <div
            key={aporte.id}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              marginTop: 10,
              borderRadius: 6,
              background: "#111",
              color: "white",
            }}
          >
            <p className="text-sm text-gray-400 mb-2">
              <strong>{aporte.autor}</strong>:
            </p>
            {renderAporte(aporte.texto)}
            <div style={{ marginTop: 10 }}>
              <button
                onClick={() => aprobarAporte(aporte.id)}
                style={{
                  backgroundColor: "green",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  marginRight: 10,
                  cursor: "pointer",
                }}
              >
                Aprobar
              </button>
              <button
                onClick={() => eliminarAporte(aporte.id)}
                style={{
                  backgroundColor: "red",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  cursor: "pointer",
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
