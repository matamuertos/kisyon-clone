'use client'
import { useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore'
import { db, auth } from '@/firebase/firebaseConfig'
import { onAuthStateChanged } from 'firebase/auth'

export default function Comentarios({ aporteId }) {
  const [user, setUser] = useState(null)
  const [comentarios, setComentarios] = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [colapsado, setColapsado] = useState(true)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (usuario) => {
      setUser(usuario)
      if (usuario) {
        const userDoc = await getDoc(doc(db, 'usuarios', usuario.uid))
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data()?.role === 'admin')
        }
      }
    })
    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    const ref = collection(db, 'aportes', aporteId, 'comentarios')
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const datos = snapshot.docs.map((doc) => ({
        id: doc.id,
        respuestas: [],
        ...doc.data()
      }))
      const comentariosPrincipales = datos.filter((c) => !c.respondeA)
      const respuestas = datos.filter((c) => c.respondeA)

      respuestas.forEach((r) => {
        const padre = comentariosPrincipales.find((c) => c.id === r.respondeA)
        if (padre) {
          padre.respuestas.push(r)
        }
      })

      const ordenados = comentariosPrincipales.sort((a, b) => {
        const votosA = (a.votosPositivos || 0) - (a.votosNegativos || 0)
        const votosB = (b.votosPositivos || 0) - (b.votosNegativos || 0)
        return votosB - votosA
      })

      setComentarios(ordenados)
    })

    return () => unsubscribe()
  }, [aporteId])

  const enviarComentario = async (respondeA = null) => {
    if (!user || !nuevoComentario.trim()) return

    const userDoc = await getDoc(doc(db, 'usuarios', user.uid))
    const alias = userDoc.exists() ? userDoc.data().nombreUsuario : user.email

    await addDoc(collection(db, 'aportes', aporteId, 'comentarios'), {
      texto: nuevoComentario.trim(),
      autorId: user.uid,
      nombreUsuario: alias,
      votosPositivos: 0,
      votosNegativos: 0,
      votantes: {},
      respondeA,
      creadoEn: serverTimestamp()
    })

    await updateDoc(doc(db, 'usuarios', user.uid), {
      puntos: (userDoc.data()?.puntos || 0) + 0.5
    })

    setNuevoComentario('')
  }

  const votarComentario = async (comentarioId, tipoVoto, autorId) => {
    if (!user) return

    const ref = doc(db, 'aportes', aporteId, 'comentarios', comentarioId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return

    const data = snap.data()
    if (data.votantes?.[user.uid]) return

    const incrementos = {
      votosPositivos: tipoVoto === 'up' ? 1 : 0,
      votosNegativos: tipoVoto === 'down' ? 1 : 0
    }

    await updateDoc(ref, {
      votosPositivos: (data.votosPositivos || 0) + incrementos.votosPositivos,
      votosNegativos: (data.votosNegativos || 0) + incrementos.votosNegativos,
      [`votantes.${user.uid}`]: tipoVoto
    })

    const autorRef = doc(db, 'usuarios', autorId)
    const autorSnap = await getDoc(autorRef)
    if (autorSnap.exists()) {
      const puntosActuales = autorSnap.data().puntos || 0
      let nuevoPuntaje = puntosActuales

      if (tipoVoto === 'up') {
        nuevoPuntaje += 0.1
      } else if (tipoVoto === 'down') {
        nuevoPuntaje = Math.max(puntosActuales - 0.1, -99)
      }

      await updateDoc(autorRef, {
        puntos: nuevoPuntaje
      })
    }
  }

  const eliminarComentario = async (comentarioId) => {
    if (!isAdmin) return
    await deleteDoc(doc(db, 'aportes', aporteId, 'comentarios', comentarioId))
  }

  return (
    <div style={{ marginTop: 30 }}>
      <button
        onClick={() => setColapsado(!colapsado)}
        style={{
          background: '#000',
          color: '#fff',
          padding: '6px 12px',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        {colapsado ? 'Mostrar comentarios' : 'Ocultar comentarios'}
      </button>

      {!colapsado && (
        <div style={{ marginTop: 15 }}>
          <h4 style={{ fontWeight: 'bold' }}>Comentarios</h4>

          {comentarios.map((c) => {
            const puntuacion = ((c.votosPositivos || 0) - (c.votosNegativos || 0)).toFixed(1)
            return (
              <div key={c.id} style={{ marginBottom: 12 }}>
                <div style={{ border: '1px solid #ddd', padding: 10, borderRadius: 4 }}>
                  <p style={{ margin: 0 }}>
                    <strong>{c.nombreUsuario}</strong>{' '}
                    <span style={{ color: '#666' }}>({puntuacion} votos)</span>
                  </p>
                  <p style={{ marginTop: 5 }}>{c.texto}</p>
                  <div>
                    <button onClick={() => votarComentario(c.id, 'up', c.autorId)} style={{ marginRight: 5 }}>👍</button>
                    <button onClick={() => votarComentario(c.id, 'down', c.autorId)} style={{ marginRight: 5 }}>👎</button>
                    <button onClick={() => enviarComentario(c.id)} style={{ marginRight: 5 }}>Responder</button>
                    {isAdmin && (
                      <button
                        onClick={() => eliminarComentario(c.id)}
                        style={{
                          background: '#f87171',
                          color: '#fff',
                          padding: '2px 6px',
                          fontSize: 12,
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>

                {/* Respuestas */}
                {c.respuestas?.length > 0 && (
                  <div style={{ marginLeft: 20, marginTop: 8 }}>
                    {c.respuestas.map((r) => (
                      <div key={r.id} style={{ border: '1px dashed #ccc', padding: 8, borderRadius: 4, marginBottom: 6 }}>
                        <p style={{ margin: 0 }}>
                          <strong>{r.nombreUsuario}</strong>{' '}
                          <span style={{ color: '#666' }}>
                            ({((r.votosPositivos || 0) - (r.votosNegativos || 0)).toFixed(1)} votos)
                          </span>
                        </p>
                        <p style={{ marginTop: 5 }}>{r.texto}</p>
                        <div>
                          <button onClick={() => votarComentario(r.id, 'up', r.autorId)} style={{ marginRight: 5 }}>👍</button>
                          <button onClick={() => votarComentario(r.id, 'down', r.autorId)} style={{ marginRight: 5 }}>👎</button>
                          {isAdmin && (
                            <button
                              onClick={() => eliminarComentario(r.id)}
                              style={{
                                background: '#f87171',
                                color: '#fff',
                                padding: '2px 6px',
                                fontSize: 12,
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer'
                              }}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Área de comentario */}
          {user && (
            <div style={{ marginTop: 10 }}>
              <textarea
                rows={3}
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Escribe tu comentario"
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              ></textarea>
              <button
                onClick={() => enviarComentario()}
                style={{
                  marginTop: 5,
                  padding: '6px 12px',
                  backgroundColor: '#111',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4
                }}
              >
                Enviar comentario
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
