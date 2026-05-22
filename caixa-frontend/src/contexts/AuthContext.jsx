import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('usuario')
    return saved ? JSON.parse(saved) : null
  })

  const login = (dados) => {
    localStorage.setItem('token', dados.token)
    localStorage.setItem('usuario', JSON.stringify({
      nome: dados.nome,
      email: dados.email,
      perfil: dados.perfil,
    }))
    setUsuario({ nome: dados.nome, email: dados.email, perfil: dados.perfil })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
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