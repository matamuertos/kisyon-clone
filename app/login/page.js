'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { auth, db } from "@/firebase/firebaseConfig";

export default function Registro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const router = useRouter();

  const handleRegistro = async (e) => {
    e.preventDefault();

    const alias = nombreUsuario.trim();

    // Validar alias
    const aliasValido = /^[a-zA-Z0-9_]+$/.test(alias);
    if (!alias) {
      setMensaje("Debes elegir un nombre de usuario.");
      return;
    }
    if (!aliasValido) {
      setMensaje("El nombre de usuario solo puede contener letras, números y guiones bajos (_).");
      return;
    }

    try {
      // Verificar si el alias ya existe
      const aliasQuery = query(collection(db, "usuarios"), where("nombreUsuario", "==", alias));
      const aliasSnapshot = await getDocs(aliasQuery);

      if (!aliasSnapshot.empty) {
        setMensaje("Ese nombre de usuario ya está en uso. Elige otro.");
        return;
      }

      // Crear usuario en Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Crear documento en Firestore
      await setDoc(doc(db, "usuarios", uid), {
        email,
        nombreUsuario: alias,
        puntos: 0,
        role: "user"
      });

      setMensaje("Registro exitoso 🎉 Redirigiendo...");
      setEmail("");
      setPassword("");
      setNombreUsuario("");

      setTimeout(() => {
        router.push("/");
      }, 2000); // 2 segundos

    } catch (error) {
      console.error("Error al registrar:", error);
      setMensaje(error.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 20 }}>
      <h2 className="text-xl font-bold mb-4">Crear cuenta</h2>
      <form onSubmit={handleRegistro}>
        <input
          type="text"
          placeholder="Nombre de usuario"
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          required
          style={{ display: "block", marginBottom: 10, width: "100%", padding: 8 }}
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: "block", marginBottom: 10, width: "100%", padding: 8 }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: "block", marginBottom: 10, width: "100%", padding: 8 }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: "#1f2937",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          Registrarse
        </button>
      </form>
      {mensaje && <p style={{ marginTop: 15 }}>{mensaje}</p>}
    </div>
  );
}
