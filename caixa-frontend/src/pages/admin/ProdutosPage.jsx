import { useState, useEffect } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import toast from "react-hot-toast";
import { Plus, Pencil, ToggleLeft, ToggleRight } from "lucide-react";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    categoriaId: "",
    precoCusto: "",
    precoVenda: "",
    estoqueAtual: "",
    estoqueMinimo: "",
    imagemUrl: "",
  });

  useEffect(() => {
    const carregar = async () => {
      try {
        const [produtosRes, categoriasRes] = await Promise.all([
          api.get(mostrarTodos ? "/api/produtos/todos" : "/api/produtos"),
          api.get("/api/categorias"),
        ]);
        setProdutos(produtosRes.data);
        setCategorias(categoriasRes.data);
      } catch (_error) {
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [mostrarTodos]);

  const carregarProdutos = async () => {
    try {
      const response = await api.get(
        mostrarTodos ? "/api/produtos/todos" : "/api/produtos",
      );
      setProdutos(response.data);
    } catch (_error) {
      toast.error("Erro ao carregar produtos");
    }
  };

  const abrirModal = (produto = null) => {
    setEditando(produto);
    setForm(
      produto
        ? {
            nome: produto.nome,
            categoriaId: produto.categoriaId,
            precoCusto: produto.precoCusto,
            precoVenda: produto.precoVenda,
            estoqueAtual: produto.estoqueAtual,
            estoqueMinimo: produto.estoqueMinimo,
            imagemUrl: produto.imagemUrl || "",
          }
        : {
            nome: "",
            categoriaId: "",
            precoCusto: "",
            precoVenda: "",
            estoqueAtual: "",
            estoqueMinimo: "",
            imagemUrl: "",
          },
    );
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const salvar = async () => {
    if (
      !form.nome.trim() ||
      !form.categoriaId ||
      !form.precoCusto ||
      !form.precoVenda
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome,
        categoriaId: Number(form.categoriaId),
        precoCusto: Number(form.precoCusto),
        precoVenda: Number(form.precoVenda),
        estoqueAtual: Number(form.estoqueAtual) || 0,
        estoqueMinimo: Number(form.estoqueMinimo) || 0,
        imagemUrl: form.imagemUrl || null,
      };
      if (editando) {
        await api.put(`/api/produtos/${editando.id}`, payload);
        toast.success("Produto atualizado!");
      } else {
        await api.post("/api/produtos", payload);
        toast.success("Produto criado!");
      }
      fecharModal();
      carregarProdutos();
    } catch (_error) {
      toast.error("Erro ao salvar produto");
    } finally {
      setSalvando(false);
    }
  };

  const alterarStatus = async (produto) => {
    try {
      const acao = produto.ativo ? "desativar" : "ativar";
      await api.patch(`/api/produtos/${produto.id}/${acao}`);
      toast.success(`Produto ${produto.ativo ? "desativado" : "ativado"}!`);
      carregarProdutos();
    } catch (_error) {
      toast.error("Erro ao alterar status");
    }
  };

  const formatarMoeda = (valor) =>
    Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie o catálogo de produtos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarTodos(!mostrarTodos)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              mostrarTodos
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {mostrarTodos ? "Mostrando todos" : "Somente ativos"}
          </button>
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Novo produto
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : produtos.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Nenhum produto cadastrado
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Produto
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Categoria
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Preço venda
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Estoque
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr
                  key={produto.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">
                      {produto.nome}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                      {produto.categoriaNome}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {formatarMoeda(produto.precoVenda)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-sm font-medium ${
                        produto.estoqueBaixo ? "text-red-600" : "text-gray-800"
                      }`}
                    >
                      {produto.estoqueAtual}
                      {produto.estoqueBaixo && (
                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          Baixo
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        produto.ativo
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirModal(produto)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => alterarStatus(produto)}
                        className={`p-2 rounded-lg transition-colors ${
                          produto.ativo
                            ? "text-green-500 hover:text-red-500 hover:bg-red-50"
                            : "text-gray-400 hover:text-green-500 hover:bg-green-50"
                        }`}
                      >
                        {produto.ativo ? (
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editando ? "Editar produto" : "Novo produto"}
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Ex: Coca-Cola Lata"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  name="categoriaId"
                  value={form.categoriaId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de custo *
                  </label>
                  <input
                    name="precoCusto"
                    type="number"
                    step="0.01"
                    value={form.precoCusto}
                    onChange={handleChange}
                    placeholder="0,00"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de venda *
                  </label>
                  <input
                    name="precoVenda"
                    type="number"
                    step="0.01"
                    value={form.precoVenda}
                    onChange={handleChange}
                    placeholder="0,00"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque atual
                  </label>
                  <input
                    name="estoqueAtual"
                    type="number"
                    value={form.estoqueAtual}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque mínimo
                  </label>
                  <input
                    name="estoqueMinimo"
                    type="number"
                    value={form.estoqueMinimo}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da imagem
                </label>
                <input
                  name="imagemUrl"
                  value={form.imagemUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={fecharModal}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
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
