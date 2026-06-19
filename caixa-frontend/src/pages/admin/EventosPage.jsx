import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Plus, LockOpen, Lock, BarChart2, HandCoins, AlertTriangle } from 'lucide-react'

export default function EventosPage() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', data: '' })
  const [confirmandoFechamento, setConfirmandoFechamento] = useState(null)
  const [fechando, setFechando] = useState(false)
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

  const fechar = async () => {
    if (!confirmandoFechamento) return
    setFechando(true)
    try {
      await api.patch(`/api/eventos/${confirmandoFechamento.id}/fechar`)
      toast.success('Evento fechado!')
      setConfirmandoFechamento(null)
      carregarEventos()
    } catch (_error) {
      toast.error('Erro ao fechar evento')
    } finally {
      setFechando(false)
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
          <h1 className="text-2xl font-bold text-brand-dark">Eventos</h1>
          <p className="text-brand-brown/70 text-sm mt-1">Gerencie os dias de festa</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
          style={{ background: '#243757' }}
        >
          <Plus size={16} />
          Novo evento
        </button>
      </div>

      {/* Lista de eventos */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-brand-brown/50">Carregando...</div>
        ) : eventos.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-brand-brown/50">Nenhum evento cadastrado</div>
        ) : (
          eventos.map((evento) => (
            <div key={evento.id} className="bg-white rounded-xl shadow-sm border border-brand-tan/40 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    evento.status === 'ABERTO' ? 'bg-green-100' : 'bg-brand-sand/50'
                  }`}>
                    {evento.status === 'ABERTO'
                      ? <LockOpen size={20} className="text-green-600" />
                      : <Lock size={20} className="text-brand-brown/70" />
                    }
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-dark">{evento.nome}</h3>
                    <p className="text-sm text-brand-brown/70 mt-0.5">
                      {formatarData(evento.data)} · Criado por {evento.criadoPorNome}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        evento.status === 'ABERTO'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-brand-sand/50 text-brand-brown'
                      }`}>
                        {evento.status === 'ABERTO' ? 'Aberto' : 'Fechado'}
                      </span>
                      {evento.abertoEm && (
                        <span className="text-xs text-brand-brown/50">
                          Aberto em {formatarDataHora(evento.abertoEm)}
                        </span>
                      )}
                      {evento.fechadoEm && (
                        <span className="text-xs text-brand-brown/50">
                          · Fechado em {formatarDataHora(evento.fechadoEm)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/relatorio/${evento.id}`)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-brand-teal hover:bg-brand-sand rounded-lg transition-colors"
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
                      onClick={() => setConfirmandoFechamento(evento)}
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
            <h2 className="text-lg font-bold text-brand-dark mb-4">Novo evento</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-brown mb-1">Nome *</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Festa Junina 2026"
                  className="w-full border border-brand-tan rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-brown mb-1">Data *</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="w-full border border-brand-tan rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-sm text-brand-brown hover:bg-brand-sand/50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-4 py-2 text-sm hover:opacity-90 disabled:opacity-50 text-white rounded-lg transition-colors hover:opacity-90" style={{ background: '#243757' }}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal confirmação de fechamento */}
      {confirmandoFechamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

            <div className="flex flex-col items-center text-center mb-6">
              <div className="bg-red-100 p-4 rounded-full mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-brand-dark">Fechar evento?</h2>
              <p className="text-brand-brown/70 text-sm mt-2">
                Você está prestes a fechar o evento
              </p>
              <p className="font-semibold text-brand-dark mt-1">
                {confirmandoFechamento.nome}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
              <p className="text-sm text-red-700 font-medium">Atenção:</p>
              <p className="text-sm text-red-600 mt-0.5">
                Após fechado, não será possível registrar novas vendas neste evento. Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmandoFechamento(null)}
                disabled={fechando}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-brand-brown border border-brand-tan rounded-xl hover:bg-brand-sand/50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={fechar}
                disabled={fechando}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                {fechando ? 'Fechando...' : 'Sim, fechar evento'}
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  )
}