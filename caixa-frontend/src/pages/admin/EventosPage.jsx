import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Plus, LockOpen, Lock, BarChart2, HandCoins } from 'lucide-react'

export default function EventosPage() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', data: '' })
  const navigate = useNavigate()

  useEffect(() => {
    const carregar = async () => {
      try {
        const response = await api.get('/api/eventos')
        setEventos(response.data)
      } catch (_error) {
        toast.error('Erro ao carregar eventos')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const carregarEventos = async () => {
    try {
      const response = await api.get('/api/eventos')
      setEventos(response.data)
    } catch (_error) {
      toast.error('Erro ao carregar eventos')
    }
  }

  const salvar = async () => {
    if (!form.nome.trim() || !form.data) {
      toast.error('Nome e data são obrigatórios')
      return
    }
    setSalvando(true)
    try {
      await api.post('/api/eventos', form)
      toast.success('Evento criado!')
      setModalAberto(false)
      setForm({ nome: '', data: '' })
      carregarEventos()
    } catch (error) {
      toast.error(error.response?.data?.erro || 'Erro ao criar evento')
    } finally {
      setSalvando(false)
    }
  }

  const fechar = async (id) => {
    if (!confirm('Deseja fechar este evento? Não será possível registrar novas vendas.')) return
    try {
      await api.patch(`/api/eventos/${id}/fechar`)
      toast.success('Evento fechado!')
      carregarEventos()
    } catch (_error) {
      toast.error('Erro ao fechar evento')
    }
  }

  const formatarData = (data) =>
    new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })

  const formatarDataHora = (data) =>
    new Date(data).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os dias de festa</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Novo evento
        </button>
      </div>

      {/* Lista de eventos */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400">Carregando...</div>
        ) : eventos.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400">Nenhum evento cadastrado</div>
        ) : (
          eventos.map((evento) => (
            <div key={evento.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    evento.status === 'ABERTO' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {evento.status === 'ABERTO'
                      ? <LockOpen size={20} className="text-green-600" />
                      : <Lock size={20} className="text-gray-500" />
                    }
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{evento.nome}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatarData(evento.data)} · Criado por {evento.criadoPorNome}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        evento.status === 'ABERTO'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {evento.status === 'ABERTO' ? 'Aberto' : 'Fechado'}
                      </span>
                      {evento.abertoEm && (
                        <span className="text-xs text-gray-400">
                          Aberto em {formatarDataHora(evento.abertoEm)}
                        </span>
                      )}
                      {evento.fechadoEm && (
                        <span className="text-xs text-gray-400">
                          · Fechado em {formatarDataHora(evento.fechadoEm)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/relatorio/${evento.id}`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <BarChart2 size={16} />
                    Relatório
                  </button>
                  <button
                    onClick={() => navigate(`/admin/fiado/${evento.id}`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <HandCoins size={16} />
                    Fiado
                  </button>
                  {evento.status === 'ABERTO' && (
                    <button
                      onClick={() => fechar(evento.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Lock size={16} />
                      Fechar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Novo evento</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Festa Junina 2026"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}