'use client'
import { useState } from "react";
import { db, auth } from "@/firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function EnviarPage() {
  const [texto, setTexto] = useState("");
  const [user, setUser] = useState(null);
  const router = useRouter();

  onAuthStateChanged(auth, (usuario) => {
    if (usuario) setUser(usuario);
    else router.push("/login");
  });

  const enviarAporte = async () => {
    if (!texto.trim()) return;
    try {
      await addDoc(collection(db, "aportes"), {
        texto,
        autor: user.email,
        aprobado: false,
        creadoEn: serverTimestamp()
      });
      setTexto("");
      alert("Tu aporte ha sido enviado y está esperando aprobación.");
    } catch (e) {
      console.error("Error al enviar el aporte:", e);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h2>Enviar aporte</h2>
      <textarea
        rows={5}
        placeholder="Escribe tu aporte aquí..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        style={{ width: "100%", padding: 10 }}
      />
      <button onClick={enviarAporte} style={{ marginTop: 10 }}>Enviar</button>
    </div>
  );
}
