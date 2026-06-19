import { Pencil, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregarCategorias = async () => {
    try {
      const response = await api.get("/api/categorias/todas");
      setCategorias(response.data);
    } catch (_error) {
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const carregar = async () => {
      try {
        const response = await api.get("/api/categorias/todas");
        setCategorias(response.data);
      } catch (_error) {
        toast.error("Erro ao carregar categorias");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const abrirModal = (categoria = null) => {
    setEditando(categoria);
    setNome(categoria ? categoria.nome : "");
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
    setNome("");
  };

  const salvar = async () => {
    if (!nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    setSalvando(true);
    try {
      if (editando) {
        await api.put(`/api/categorias/${editando.id}`, { nome });
        toast.success("Categoria atualizada!");
      } else {
        await api.post("/api/categorias", { nome });
        toast.success("Categoria criada!");
      }
      fecharModal();
      carregarCategorias();
    } catch (_error) {
      toast.error("Erro ao salvar categoria");
    } finally {
      setSalvando(false);
    }
  };

  const alterarStatus = async (categoria) => {
    try {
      const acao = categoria.ativo ? "desativar" : "ativar";
      await api.patch(`/api/categorias/${categoria.id}/${acao}`);
      toast.success(`Categoria ${categoria.ativo ? "desativada" : "ativada"}!`);
      carregarCategorias();
    } catch (_error) {
      toast.error("Erro ao alterar status");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Categorias</h1>
          <p className="text-brand-brown/70 text-sm mt-1">
            Gerencie as categorias de produtos
          </p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 bg-brand-dark hover:bg-brand-teal text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Nova categoria
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-brand-tan/40 overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-brand-brown/50">Carregando...</div>
        ) : categorias.length === 0 ? (
          <div className="p-8 text-center text-brand-brown/50">
            Nenhuma categoria cadastrada
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-tan/40">
                <th className="text-left px-6 py-4 text-sm font-medium text-brand-brown/70">
                  Nome
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-brand-brown/70">
                  Status
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-brand-brown/70">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr
                  key={categoria.id}
                  className="border-b border-brand-tan/20 last:border-0 hover:bg-brand-sand/30"
                >
                  <td className="px-6 py-4 text-sm text-brand-dark font-medium">
                    {categoria.nome}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        categoria.ativo
                          ? "bg-green-100 text-green-700"
                          : "bg-brand-sand/50 text-brand-brown/70"
                      }`}
                    >
                      {categoria.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirModal(categoria)}
                        className="p-2 text-brand-brown/50 hover:text-brand-teal hover:bg-brand-sand rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => alterarStatus(categoria)}
                        className={`p-2 rounded-lg transition-colors ${
                          categoria.ativo
                            ? "text-green-500 hover:text-red-500 hover:bg-red-50"
                            : "text-brand-brown/50 hover:text-green-500 hover:bg-green-50"
                        }`}
                        title={categoria.ativo ? "Desativar" : "Ativar"}
                      >
                        {categoria.ativo ? (
                          <ToggleRight size={20} />
                        ) : (
                          <ToggleLeft size={20} />
                        )}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-4">
              {editando ? "Editar categoria" : "Nova categoria"}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-brown mb-1">
                Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && salvar()}
                placeholder="Ex: Bebidas"
                className="w-full border border-brand-tan rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
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
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
