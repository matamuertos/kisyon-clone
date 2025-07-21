'use client'
import { useEffect, useState } from "react";
import { db, auth } from "@/firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [aportes, setAportes] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuario) => {
      if (usuario) {
        setUser(usuario);
        cargarAportes();
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  const cargarAportes = () => {
    const q = query(collection(db, "aportes"), where("aprobado", "==", false));
    onSnapshot(q, (snapshot) => {
      const nuevos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAportes(nuevos);
    });
  };

  const aprobarAporte = async (id) => {
    try {
      const docRef = doc(db, "aportes", id);
      await updateDoc(docRef, { aprobado: true });
    } catch (e) {
      console.error("Error al aprobar aporte", e);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h2>Aportes pendientes</h2>
      {aportes.length === 0 && <p>No hay aportes pendientes.</p>}
      {aportes.map((aporte) => (
        <div key={aporte.id} style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
          <p><strong>{aporte.autor}</strong>:</p>
          <p>{aporte.texto}</p>
          <button onClick={() => aprobarAporte(aporte.id)} style={{ marginTop: 5 }}>
            Aprobar
          </button>
        </div>
      ))}
    </div>
  );
}
