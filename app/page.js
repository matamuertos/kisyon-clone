'use client'
import { useEffect, useState } from "react";
import { db } from "@/firebase/firebaseConfig";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

export default function HomePage() {
  const [aportes, setAportes] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "aportes"),
      where("aprobado", "==", true),
      orderBy("creadoEn", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const aprobados = snapshot.docs.map((doc) => doc.data());
      setAportes(aprobados);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h1>Aportes aprobados</h1>
      {aportes.length === 0 && <p>Aún no hay aportes aprobados.</p>}
      {aportes.map((aporte, index) => (
        <div key={index} style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
          <p><strong>{aporte.autor}</strong>:</p>
          <p>{aporte.texto}</p>
        </div>
      ))}
    </div>
  );
}
