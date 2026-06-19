import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

// Deve bater com jwt.expiration do backend (86400000 ms = 24h)
const TOKEN_DURATION_MS = 86400000

function limparSessao() {
  localStorage.removeItem('token')
  localStorage.removeItem('tokenExpiry')
  localStorage.removeItem('usuario')
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const validar = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setCarregando(false)
        return
      }

      // Verifica expiração antes de fazer requisição
      const expiry = localStorage.getItem('tokenExpiry')
      if (expiry && Date.now() > Number(expiry)) {
        limparSessao()
        setCarregando(false)
        return
      }

      try {
        await api.get('/api/auth/me')
        const saved = localStorage.getItem('usuario')
        setUsuario(saved ? JSON.parse(saved) : null)
      } catch {
        limparSessao()
        setUsuario(null)
      } finally {
        setCarregando(false)
      }
    }
    validar()
  }, [])

  if (carregando) return null

  const login = (dados) => {
    localStorage.setItem('token', dados.token)
    localStorage.setItem('tokenExpiry', String(Date.now() + TOKEN_DURATION_MS))
    localStorage.setItem('usuario', JSON.stringify({
      nome: dados.nome,
      email: dados.email,
      perfil: dados.perfil,
    }))
    setUsuario({ nome: dados.nome, email: dados.email, perfil: dados.perfil })
  }

  const logout = () => {
    limparSessao()
    setUsuario(null)
  }

  const isAdmin = () => usuario?.perfil === 'ADMIN'

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
