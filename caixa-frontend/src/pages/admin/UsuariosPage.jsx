import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'OPERADOR',
  })

  useEffect(() => {
    const carregar = async () => {
      try {
        const response = await api.get('/api/usuarios')
        setUsuarios(response.data)
      } catch (_error) {
        toast.error('Erro ao carregar usuários')
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const carregarUsuarios = async () => {
    try {
      const response = await api.get('/api/usuarios')
      setUsuarios(response.data)
    } catch (_error) {
      toast.error('Erro ao carregar usuários')
    }
  }

  const abrirModal = (usuario = null) => {
    setEditando(usuario)
    setForm(usuario ? {
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfil: usuario.perfil,
    } : {
      nome: '',
      email: '',
      senha: '',
      perfil: 'OPERADOR',
    })
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setEditando(null)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const salvar = async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error('Nome e email são obrigatórios')
      return
    }
    if (!editando && !form.senha.trim()) {
      toast.error('Senha é obrigatória para novo usuário')
      return
    }
    setSalvando(true)
    try {
      const payload = {
        nome: form.nome,
        email: form.email,
        senha: form.senha || undefined,
        perfil: form.perfil,
      }
      if (editando) {
        await api.put(`/api/usuarios/${editando.id}`, payload)
        toast.success('Usuário atualizado!')
      } else {
        await api.post('/api/usuarios', payload)
        toast.success('Usuário criado!')
      }
      fecharModal()
      carregarUsuarios()
    } catch (_error) {
      toast.error('Erro ao salvar usuário')
    } finally {
      setSalvando(false)
    }
  }

  const alterarStatus = async (usuario) => {
    try {
      const acao = usuario.ativo ? 'desativar' : 'ativar'
      await api.patch(`/api/usuarios/${usuario.id}/${acao}`)
      toast.success(`Usuário ${usuario.ativo ? 'desativado' : 'ativado'}!`)
      carregarUsuarios()
    } catch (_error) {
      toast.error('Erro ao alterar status')
    }
  }

  const formatarData = (data) =>
    new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Usuários</h1>
          <p className="text-brand-brown/70 text-sm mt-1">Gerencie os operadores de caixa</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-brand-dark hover:bg-brand-teal text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Novo usuário
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-brand-tan/40 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-brand-brown/50">Carregando...</div>
        ) : usuarios.length === 0 ? (
          <div className="p-8 text-center text-brand-brown/50">Nenhum usuário cadastrado</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-tan/40">
                <th className="text-left px-6 py-4 text-sm font-medium text-brand-brown/70">Nome</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-brand-brown/70">Email</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-brand-brown/70">Perfil</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-brand-brown/70">Criado em</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-brand-brown/70">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-brand-brown/70">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-brand-tan/20 last:border-0 hover:bg-brand-sand/30">
                  <td className="px-6 py-4 text-sm font-medium text-brand-dark">{usuario.nome}</td>
                  <td className="px-6 py-4 text-sm text-brand-brown">{usuario.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      usuario.perfil === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {usuario.perfil === 'ADMIN' ? 'Administrador' : 'Operador'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-brown">
                    {usuario.criadoEm ? formatarData(usuario.criadoEm) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      usuario.ativo ? 'bg-green-100 text-green-700' : 'bg-brand-sand/50 text-brand-brown/70'
                    }`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirModal(usuario)}
                        className="p-2 text-brand-brown/50 hover:text-brand-teal hover:bg-brand-sand rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => alterarStatus(usuario)}
                        className={`p-2 rounded-lg transition-colors ${
                          usuario.ativo
                            ? 'text-green-500 hover:text-red-500 hover:bg-red-50'
                            : 'text-brand-brown/50 hover:text-green-500 hover:bg-green-50'
                        }`}
                      >
                        {usuario.ativo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-4">
              {editando ? 'Editar usuário' : 'Novo usuário'}
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-brown mb-1">Nome *</label>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Nome completo"
                  className="w-full border border-brand-tan rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-brown mb-1">Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  className="w-full border border-brand-tan rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-brown mb-1">
                  Senha {editando ? '(deixe em branco para manter)' : '*'}
                </label>
                <input
                  name="senha"
                  type="password"
                  value={form.senha}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full border border-brand-tan rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-brown mb-1">Perfil *</label>
                <select
                  name="perfil"
                  value={form.perfil}
                  onChange={handleChange}
                  className="w-full border border-brand-tan rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  <option value="OPERADOR">Operador</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={fecharModal}
                className="px-4 py-2 text-sm text-brand-brown hover:bg-brand-sand/50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-4 py-2 text-sm bg-brand-dark hover:bg-brand-teal disabled:opacity-50 text-white rounded-lg transition-colors"
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