import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  CalendarDays,
  ShoppingCart,
  LogOut,
  HandCoins,
  X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const menu = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/admin/produtos', label: 'Produtos', icon: Package },
  { to: '/admin/categorias', label: 'Categorias', icon: Tag },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
  { to: '/pdv', label: 'Ir para o PDV', icon: ShoppingCart },
]

export default function Sidebar({ open, onClose }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [eventoAberto, setEventoAberto] = useState(null)

  useEffect(() => {
    api.get('/api/eventos/aberto')
      .then(res => setEventoAberto(res.data))
      .catch(() => setEventoAberto(null))
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Até logo!')
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
      isActive
        ? 'bg-white/20 text-white font-semibold'
        : 'text-brand-sand/80 hover:bg-white/10 hover:text-white'
    }`

  return (
    <aside
      className={`
        fixed md:sticky top-0 left-0 h-screen z-30 w-64 flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        shadow-xl md:shadow-none
      `}
      style={{ background: 'linear-gradient(180deg, #243757 0%, #1c2d44 100%)' }}
    >

      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-brand-teal/60 rounded-xl p-1.5">
            <ShoppingCart size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white">Sistema Caixa</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded-lg hover:bg-white/10 transition-colors text-brand-sand"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Usuário logado */}
      <div className="px-6 py-4 border-b border-white/10">
        <p className="text-brand-tan text-xs mb-0.5">Logado como</p>
        <p className="font-semibold text-sm text-white truncate">{usuario?.nome}</p>
        <span className="text-xs bg-brand-teal/50 text-brand-sand px-2 py-0.5 rounded-full mt-1.5 inline-block tracking-wide">
          {usuario?.perfil}
        </span>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {menu.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={linkClass}
            onClick={onClose}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {eventoAberto && (
          <NavLink
            to={`/admin/fiado/${eventoAberto.id}`}
            className={linkClass}
            onClick={onClose}
          >
            <HandCoins size={18} />
            Fiado
          </NavLink>
        )}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-brand-sand/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}
