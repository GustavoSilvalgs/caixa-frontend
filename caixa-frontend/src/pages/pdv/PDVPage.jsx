import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Search, Plus, Minus, Trash2,
  CheckCircle, LogOut, Tag
} from 'lucide-react'

export default function PDVPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [carrinho, setCarrinho] = useState([])
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [eventoAberto, setEventoAberto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [finalizando, setFinalizando] = useState(false)
  const [modalFiado, setModalFiado] = useState(false)
  const [clienteFiado, setClienteFiado] = useState('')

  useEffect(() => {
    const carregar = async () => {
      try {
        const [produtosRes, categoriasRes, eventoRes] = await Promise.all([
          api.get('/api/produtos'),
          api.get('/api/categorias'),
          api.get('/api/eventos/aberto').catch(() => ({ data: null })),
        ])
        setProdutos(produtosRes.data)
        setCategorias(categoriasRes.data)
        setEventoAberto(eventoRes.data)
      } catch (_error) {
        toast.error('Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const produtosFiltrados = produtos.filter((p) => {
    const buscaOk = p.nome.toLowerCase().includes(busca.toLowerCase())
    const categoriaOk = categoriaFiltro ? p.categoriaId === Number(categoriaFiltro) : true
    return buscaOk && categoriaOk
  })

  const adicionarAoCarrinho = (produto) => {
    if (produto.estoqueAtual <= 0) {
      toast.error('Produto sem estoque')
      return
    }
    const existente = carrinho.find((i) => i.produto.id === produto.id)
    if (existente) {
      if (existente.quantidade >= produto.estoqueAtual) {
        toast.error('Quantidade máxima atingida')
        return
      }
      setCarrinho(carrinho.map((i) =>
        i.produto.id === produto.id
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
      ))
    } else {
      setCarrinho([...carrinho, { produto, quantidade: 1 }])
    }
  }

  const alterarQuantidade = (produtoId, delta) => {
    setCarrinho(carrinho
      .map((i) => i.produto.id === produtoId
        ? { ...i, quantidade: i.quantidade + delta }
        : i
      )
      .filter((i) => i.quantidade > 0)
    )
  }

  const removerDoCarrinho = (produtoId) => {
    setCarrinho(carrinho.filter((i) => i.produto.id !== produtoId))
  }

  const limparCarrinho = () => {
    setCarrinho([])
    setClienteFiado('')
  }

  const total = carrinho.reduce(
    (acc, i) => acc + Number(i.produto.precoVenda) * i.quantidade, 0
  )

  const finalizar = async (tipo) => {
    if (carrinho.length === 0) {
      toast.error('Adicione produtos ao carrinho')
      return
    }
    if (!eventoAberto) {
      toast.error('Nenhum evento aberto. Contate o administrador.')
      return
    }
    if (tipo === 'FIADO' && !clienteFiado.trim()) {
      toast.error('Informe o nome do cliente')
      return
    }

    setFinalizando(true)
    try {
      await api.post('/api/vendas', {
        tipo,
        clienteFiado: tipo === 'FIADO' ? clienteFiado : null,
        itens: carrinho.map((i) => ({
          produtoId: i.produto.id,
          quantidade: i.quantidade,
        })),
      })
      toast.success('Venda realizada!')
      limparCarrinho()
      setModalFiado(false)

      // Atualiza estoque dos produtos
      const response = await api.get('/api/produtos')
      setProdutos(response.data)
    } catch (error) {
      toast.error(error.response?.data?.erro || 'Erro ao finalizar venda')
    } finally {
      setFinalizando(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const formatarMoeda = (valor) =>
    Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Header */}
      <header className="bg-indigo-700 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart size={22} />
          <span className="font-bold text-lg">PDV</span>
          {eventoAberto ? (
            <span className="text-xs bg-green-500 px-2 py-1 rounded-full">
              {eventoAberto.nome}
            </span>
          ) : (
            <span className="text-xs bg-red-500 px-2 py-1 rounded-full">
              Sem evento aberto
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-indigo-200">{usuario?.nome}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-indigo-200 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 52px)' }}>

        {/* Produtos */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">

          {/* Filtros */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid de produtos */}
          <div className="flex-1 overflow-y-auto">
            {produtosFiltrados.length === 0 ? (
              <div className="text-center text-gray-400 py-12">Nenhum produto encontrado</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {produtosFiltrados.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.estoqueAtual <= 0}
                    className={`bg-white rounded-xl p-4 text-left border transition-all ${
                      produto.estoqueAtual <= 0
                        ? 'opacity-50 cursor-not-allowed border-gray-100'
                        : 'border-gray-100 hover:border-indigo-300 hover:shadow-md active:scale-95'
                    }`}
                  >
                    <div className="bg-indigo-50 rounded-lg p-3 mb-3 flex items-center justify-center">
                      <ShoppingCart size={20} className="text-indigo-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-800 leading-tight">{produto.nome}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{produto.categoriaNome}</p>
                    <p className="text-sm font-bold text-indigo-600 mt-2">
                      {formatarMoeda(produto.precoVenda)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      produto.estoqueBaixo ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      Estoque: {produto.estoqueAtual}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carrinho */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <ShoppingCart size={18} />
              Carrinho
            </h2>
            {carrinho.length > 0 && (
              <button
                onClick={limparCarrinho}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Itens do carrinho */}
          <div className="flex-1 overflow-y-auto p-4">
            {carrinho.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                Nenhum item adicionado
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {carrinho.map((item) => (
                  <div key={item.produto.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.produto.nome}
                      </p>
                      <p className="text-xs text-indigo-600">
                        {formatarMoeda(Number(item.produto.precoVenda) * item.quantidade)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => alterarQuantidade(item.produto.id, -1)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => alterarQuantidade(item.produto.id, 1)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => removerDoCarrinho(item.produto.id)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total e botões */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="text-xl font-bold text-indigo-600">
                {formatarMoeda(total)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => finalizar('NORMAL')}
                disabled={finalizando || carrinho.length === 0 || !eventoAberto}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle size={18} />
                {finalizando ? 'Finalizando...' : 'Finalizar venda'}
              </button>
              <button
                onClick={() => setModalFiado(true)}
                disabled={finalizando || carrinho.length === 0 || !eventoAberto}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-sm"
              >
                Fiado
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Fiado */}
      {modalFiado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Venda no fiado</h2>
            <div className="mb-2">
              <p className="text-sm text-gray-500 mb-3">
                Total: <span className="font-bold text-indigo-600">{formatarMoeda(total)}</span>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do cliente *
              </label>
              <input
                value={clienteFiado}
                onChange={(e) => setClienteFiado(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && finalizar('FIADO')}
                placeholder="Nome de quem vai ficar devendo"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setModalFiado(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => finalizar('FIADO')}
                disabled={finalizando}
                className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg"
              >
                {finalizando ? 'Finalizando...' : 'Confirmar fiado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}