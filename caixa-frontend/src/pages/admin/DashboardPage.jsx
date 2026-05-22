import AdminLayout from '../../components/layout/AdminLayout'
import { useAuth } from '../../contexts/AuthContext'
import { ShoppingCart, Package, CalendarDays, HandCoins } from 'lucide-react'

export default function DashboardPage() {
  const { usuario } = useAuth()

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Olá, {usuario?.nome} 👋
        </h1>
        <p className="text-gray-500 mt-1">Bem-vindo ao painel administrativo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">Vendas hoje</span>
            <div className="bg-indigo-100 p-2 rounded-lg">
              <ShoppingCart size={18} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">—</p>
          <p className="text-xs text-gray-400 mt-1">Abra um evento para ver</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">Produtos ativos</span>
            <div className="bg-green-100 p-2 rounded-lg">
              <Package size={18} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">—</p>
          <p className="text-xs text-gray-400 mt-1">Cadastre produtos</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">Evento aberto</span>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <CalendarDays size={18} className="text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">—</p>
          <p className="text-xs text-gray-400 mt-1">Nenhum evento ativo</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500 text-sm">Fiados em aberto</span>
            <div className="bg-red-100 p-2 rounded-lg">
              <HandCoins size={18} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">—</p>
          <p className="text-xs text-gray-400 mt-1">Nenhum fiado pendente</p>
        </div>
      </div>
    </AdminLayout>
  )
}