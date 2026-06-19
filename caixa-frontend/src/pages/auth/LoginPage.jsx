import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { LogIn, ShoppingCart } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const schema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, usuario } = useAuth()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario) {
      navigate(usuario.perfil === 'ADMIN' ? '/admin' : '/pdv', { replace: true })
    }
  }, [usuario, navigate])

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const response = await api.post('/api/auth/login', data)
      login(response.data)
      toast.success(`Bem-vindo, ${response.data.nome}!`)
      navigate(response.data.perfil === 'ADMIN' ? '/admin' : '/pdv')
    } catch {
      toast.error('Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #243757 0%, #3a5f6f 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        <div className="flex flex-col items-center mb-8">
          <div className="text-white rounded-2xl p-4 mb-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #3a5f6f, #243757)' }}>
            <ShoppingCart size={36} />
          </div>
          <h1 className="text-2xl font-bold text-brand-dark">Sistema de Caixa</h1>
          <p className="text-brand-brown/70 text-sm mt-1">Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-brown mb-1.5">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="seu@email.com"
              className="w-full border border-brand-tan rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent bg-brand-sand/30 transition"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-brown mb-1.5">
              Senha
            </label>
            <input
              type="password"
              {...register('senha')}
              placeholder="••••••••"
              className="w-full border border-brand-tan rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent bg-brand-sand/30 transition"
            />
            {errors.senha && (
              <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md mt-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3a5f6f, #243757)' }}
          >
            <LogIn size={18} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
