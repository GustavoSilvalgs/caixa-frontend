import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft, TrendingUp, ShoppingCart,
  HandCoins, Package, Tag
} from 'lucide-react'

export default function RelatorioPage() {
  const { eventoId } = useParams()
  const navigate = useNavigate()
  const [relatorio, setRelatorio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        const response = await api.get(`/api/relatorios/evento/${eventoId}`)
        setRelatorio(response.data)
      } catch (_error) {
        toast.error('Erro ao carregar relatório')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [eventoId])

  const formatarMoeda = (valor) =>
    Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const formatarData = (data) =>
    new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-gray-400">Carregando relatório...</div>
      </AdminLayout>
    )
  }

  if (!relatorio) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-gray-400">Relatório não encontrado</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/eventos')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{relatorio.eventoNome}</h1>
          <p className="text-gray-500 text-sm mt-1">{formatarData(relatorio.eventoData)}</p>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Total vendas</span>
            <div className="bg-indigo-100 p-2 rounded-lg">
              <ShoppingCart size={16} className="text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{relatorio.totalVendas}</p>
          <p className="text-xs text-gray-400 mt-1">
            {relatorio.totalVendasNormais} normais · {relatorio.totalVendaFiado} fiado
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Receita total</span>
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp size={16} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatarMoeda(relatorio.receitaTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">Incluindo fiados</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Receita recebida</span>
            <div className="bg-blue-100 p-2 rounded-lg">
              <TrendingUp size={16} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatarMoeda(relatorio.receitaRecebida)}</p>
          <p className="text-xs text-gray-400 mt-1">Já em caixa</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Lucro total</span>
            <div className="bg-purple-100 p-2 rounded-lg">
              <TrendingUp size={16} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatarMoeda(relatorio.lucroTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">Receita - custo</p>
        </div>
      </div>

      {/* Fiado pendente */}
      {Number(relatorio.receitaPendenteFiado) > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HandCoins size={20} className="text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">Fiado pendente</p>
              <p className="text-sm text-orange-600">Ainda não recebido</p>
            </div>
          </div>
          <p className="text-xl font-bold text-orange-700">
            {formatarMoeda(relatorio.receitaPendenteFiado)}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Produtos mais vendidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package size={18} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-800">Mais vendidos</h2>
          </div>
          <div className="p-4">
            {relatorio.produtosMaisVendidos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Nenhuma venda registrada</p>
            ) : (
              <div className="flex flex-col gap-3">
                {relatorio.produtosMaisVendidos.slice(0, 5).map((p, index) => (
                  <div key={p.produtoId} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.produtoNome}</p>
                      <p className="text-xs text-gray-400">{p.categoriaNome}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{p.quantidadeVendida} un.</p>
                      <p className="text-xs text-green-600">{formatarMoeda(p.receitaGerada)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Produtos mais lucrativos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-600" />
            <h2 className="font-semibold text-gray-800">Mais lucrativos</h2>
          </div>
          <div className="p-4">
            {relatorio.produtosMaisLucrativos.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Nenhuma venda registrada</p>
            ) : (
              <div className="flex flex-col gap-3">
                {relatorio.produtosMaisLucrativos.slice(0, 5).map((p, index) => (
                  <div key={p.produtoId} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.produtoNome}</p>
                      <p className="text-xs text-gray-400">{p.categoriaNome}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{formatarMoeda(p.lucroGerado)}</p>
                      <p className="text-xs text-gray-400">{p.quantidadeVendida} un.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Tag size={18} className="text-purple-600" />
          <h2 className="font-semibold text-gray-800">Vendas por categoria</h2>
        </div>
        <div className="p-4">
          {relatorio.categorias.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Nenhuma venda registrada</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-medium text-gray-500">Categoria</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500">Qtd vendida</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500">Receita</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.categorias.map((c) => (
                  <tr key={c.categoriaId} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-sm font-medium text-gray-800">{c.categoriaNome}</td>
                    <td className="py-3 text-sm text-gray-600 text-right">{c.quantidadeVendida}</td>
                    <td className="py-3 text-sm text-gray-800 text-right">{formatarMoeda(c.receitaGerada)}</td>
                    <td className="py-3 text-sm text-green-600 font-medium text-right">{formatarMoeda(c.lucroGerado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Resumo por operador */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <ShoppingCart size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-800">Resumo por operador</h2>
        </div>
        <div className="p-4">
          {relatorio.resumoPorOperador.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Nenhuma venda registrada</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-medium text-gray-500">Operador</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500">Vendas</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500">Total arrecadado</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.resumoPorOperador.map((o) => (
                  <tr key={o.operadorId} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 text-sm font-medium text-gray-800">{o.operadorNome}</td>
                    <td className="py-3 text-sm text-gray-600 text-right">{o.totalVendas}</td>
                    <td className="py-3 text-sm text-gray-800 font-medium text-right">{formatarMoeda(o.totalArrecadado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}