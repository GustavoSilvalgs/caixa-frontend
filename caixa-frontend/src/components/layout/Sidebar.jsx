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
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const menu = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/eventos', label: 'Eventos', icon: CalendarDays },
  { to: '/admin/produtos', label: 'Produtos', icon: Package },
  { to: '/admin/categorias', label: 'Categorias', icon: Tag },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
]

export default function Sidebar() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Até logo!')
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-indigo-700 text-white flex flex-col">

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-indigo-600">
        <div className="bg-white rounded-lg p-1.5">
          <ShoppingCart size={20} className="text-indigo-700" />
        </div>
        <span className="font-bold text-lg">Sistema Caixa</span>
      </div>

      {/* Usuário logado */}
      <div className="px-6 py-4 border-b border-indigo-600">
        <p className="text-indigo-200 text-xs">Logado como</p>
        <p className="font-medium text-sm truncate">{usuario?.nome}</p>
        <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded-full mt-1 inline-block">
          {usuario?.perfil}
        </span>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {menu.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white text-indigo-700 font-medium'
                  : 'text-indigo-100 hover:bg-indigo-600'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-indigo-600">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-indigo-100 hover:bg-indigo-600 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}