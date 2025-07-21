'use client'
import { useState } from "react";
import { auth } from "@/firebase/firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [esRegistro, setEsRegistro] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (esRegistro) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/enviar");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>{esRegistro ? "Crear cuenta" : "Iniciar sesión"}</h2>
      <form onSubmit={manejarSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{esRegistro ? "Registrarme" : "Entrar"}</button>
      </form>
      <p style={{ marginTop: 10 }}>
        {esRegistro ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
        <button onClick={() => setEsRegistro(!esRegistro)} style={{ color: "blue", background: "none", border: "none", cursor: "pointer" }}>
          {esRegistro ? "Inicia sesión" : "Regístrate"}
        </button>
      </p>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
