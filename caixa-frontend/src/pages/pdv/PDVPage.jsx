import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  LogOut,
  Tag,
  LayoutDashboard,
  X,
} from "lucide-react";

export default function PDVPage() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [eventoAberto, setEventoAberto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalizando, setFinalizando] = useState(false);
  const [modalFiado, setModalFiado] = useState(false);
  const [clienteFiado, setClienteFiado] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("DINHEIRO");
  const [valorRecebido, setValorRecebido] = useState("");
  const [clientesFiado, setClientesFiado] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [numeroVenda, setNumeroVenda] = useState(null);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [produtosRes, categoriasRes, eventoRes] = await Promise.all([
          api.get("/api/produtos"),
          api.get("/api/categorias"),
          api.get("/api/eventos/aberto").catch(() => ({ data: null })),
        ]);
        setProdutos(produtosRes.data.sort((a, b) => a.id - b.id));
        setCategorias(categoriasRes.data);
        setEventoAberto(eventoRes.data);

        if (eventoRes.data) {
          const fiadosRes = await api
            .get(`/api/fiado/evento/${eventoRes.data.id}/abertos`)
            .catch(() => ({ data: [] }));
          const nomes = [...new Set(fiadosRes.data.map((f) => f.clienteFiado))];
          setClientesFiado(nomes);
        }
      } catch {
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const produtosFiltrados = produtos.filter((p) => {
    const buscaOk = p.nome.toLowerCase().includes(busca.toLowerCase());
    const categoriaOk = categoriaFiltro ? p.categoriaId === Number(categoriaFiltro) : true;
    return buscaOk && categoriaOk;
  });

  const adicionarAoCarrinho = (produto) => {
    if (produto.estoqueAtual <= 0) { toast.error("Produto sem estoque"); return; }
    const existente = carrinho.find((i) => i.produto.id === produto.id);
    if (existente) {
      if (existente.quantidade >= produto.estoqueAtual) { toast.error("Quantidade máxima atingida"); return; }
      setCarrinho(carrinho.map((i) => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
    } else {
      setCarrinho([...carrinho, { produto, quantidade: 1 }]);
    }
  };

  const alterarQuantidade = (produtoId, delta) => {
    setCarrinho(carrinho.map((i) => i.produto.id === produtoId ? { ...i, quantidade: i.quantidade + delta } : i).filter((i) => i.quantidade > 0));
  };

  const removerDoCarrinho = (produtoId) => setCarrinho(carrinho.filter((i) => i.produto.id !== produtoId));

  const limparCarrinho = () => {
    setCarrinho([]);
    setClienteFiado("");
    setFormaPagamento("DINHEIRO");
    setValorRecebido("");
  };

  const carregarClientesFiado = async (eventoId) => {
    try {
      const fiadosRes = await api.get(`/api/fiado/evento/${eventoId}/abertos`);
      const nomes = [...new Set(fiadosRes.data.map((f) => f.clienteFiado))];
      setClientesFiado(nomes);
    } catch { /* silencioso */ }
  };

  const total = carrinho.reduce((acc, i) => acc + Number(i.produto.precoVenda) * i.quantidade, 0);
  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0);

  const finalizar = async (tipo) => {
    if (carrinho.length === 0) { toast.error("Adicione produtos ao carrinho"); return; }
    if (!eventoAberto) { toast.error("Nenhum evento aberto. Contate o administrador."); return; }
    if (tipo === "FIADO" && !clienteFiado.trim()) { toast.error("Informe o nome do cliente"); return; }

    setFinalizando(true);
    try {
      const response = await api.post("/api/vendas", {
        tipo,
        formaPagamento,
        clienteFiado: tipo === "FIADO" ? clienteFiado : null,
        itens: carrinho.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
      });

      toast.success(`Venda #${response.data.numeroVendaEvento} realizada!`);
      setNumeroVenda(response.data.numeroVendaEvento);
      limparCarrinho();
      setModalFiado(false);
      setCarrinhoAberto(false);

      if (tipo === "FIADO" && eventoAberto) await carregarClientesFiado(eventoAberto.id);

      const produtosAtualizados = await api.get("/api/produtos");
      setProdutos(produtosAtualizados.data.sort((a, b) => a.id - b.id));
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao finalizar venda");
    } finally {
      setFinalizando(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const formatarMoeda = (valor) =>
    Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-sand/30 flex items-center justify-center">
        <p className="text-brand-brown/60">Carregando...</p>
      </div>
    );
  }

  const carrinhoJSX = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-brand-tan/40 flex items-center justify-between">
        <h2 className="font-semibold text-brand-dark flex items-center gap-2">
          <ShoppingCart size={18} />
          Carrinho
          {numeroVenda && (
            <span className="text-xs bg-brand-sand text-brand-dark px-2 py-0.5 rounded-full font-medium">
              Última: #{numeroVenda}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {carrinho.length > 0 && (
            <button onClick={limparCarrinho} className="text-xs text-red-500 hover:text-red-600">
              Limpar
            </button>
          )}
          <button onClick={() => setCarrinhoAberto(false)} className="md:hidden p-1 text-brand-brown/50 hover:text-brand-brown">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {carrinho.length === 0 ? (
          <div className="text-center text-brand-brown/50 py-8 text-sm">Nenhum item adicionado</div>
        ) : (
          <div className="flex flex-col gap-3">
            {carrinho.map((item) => (
              <div key={item.produto.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-dark truncate">{item.produto.nome}</p>
                  <p className="text-xs text-brand-teal font-medium">
                    {formatarMoeda(Number(item.produto.precoVenda) * item.quantidade)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => alterarQuantidade(item.produto.id, -1)} className="p-1 text-brand-brown/50 hover:text-brand-brown hover:bg-brand-sand rounded">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-brand-dark">{item.quantidade}</span>
                  <button onClick={() => alterarQuantidade(item.produto.id, 1)} className="p-1 text-brand-brown/50 hover:text-brand-brown hover:bg-brand-sand rounded">
                    <Plus size={14} />
                  </button>
                  <button onClick={() => removerDoCarrinho(item.produto.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded ml-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-brand-tan/40">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-brand-dark">Total</span>
          <span className="text-xl font-bold text-brand-teal">{formatarMoeda(total)}</span>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-brand-brown/70 mb-1">Forma de pagamento</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { valor: "DINHEIRO", label: "💵 Dinheiro" },
              { valor: "PIX", label: "📱 Pix" },
              { valor: "CARTAO_DEBITO", label: "💳 Débito" },
              { valor: "CARTAO_CREDITO", label: "💳 Crédito" },
            ].map((fp) => (
              <button
                key={fp.valor}
                type="button"
                onClick={() => setFormaPagamento(fp.valor)}
                className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors border ${
                  formaPagamento === fp.valor
                    ? "text-white border-brand-dark"
                    : "bg-white text-brand-brown border-brand-tan hover:bg-brand-sand/40"
                }`}
                style={formaPagamento === fp.valor ? { background: '#243757' } : {}}
              >
                {fp.label}
              </button>
            ))}
          </div>
        </div>

        {formaPagamento === "DINHEIRO" && carrinho.length > 0 && (
          <div className="mb-3 bg-brand-sand/30 rounded-xl p-3 border border-brand-tan/40">
            <p className="text-xs font-medium text-brand-brown/70 mb-2">Valor recebido</p>

            {/* Notas rápidas */}
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[2, 5, 10, 20, 50, 100, 200].map((nota) => (
                <button
                  key={nota}
                  type="button"
                  onClick={() => setValorRecebido(v => String((Number(v) || 0) + nota))}
                  className="py-1.5 rounded-lg text-xs font-semibold border border-brand-tan bg-white text-brand-dark hover:bg-brand-sand transition-colors"
                >
                  +{nota}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setValorRecebido("")}
                className="py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-white text-red-500 hover:bg-red-50 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Input manual */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-brand-brown/50">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                placeholder="0,00"
                className="w-full border border-brand-tan rounded-lg pl-9 pr-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white"
              />
            </div>

            {/* Resultado */}
            {valorRecebido && Number(valorRecebido) > 0 && (
              <div className={`mt-2 rounded-lg px-3 py-2.5 flex items-center justify-between ${
                Number(valorRecebido) >= total
                  ? "bg-green-100 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}>
                <span className={`text-xs font-medium ${Number(valorRecebido) >= total ? "text-green-700" : "text-red-600"}`}>
                  {Number(valorRecebido) >= total ? "Troco" : "Falta"}
                </span>
                <span className={`text-base font-bold ${Number(valorRecebido) >= total ? "text-green-700" : "text-red-600"}`}>
                  {formatarMoeda(Math.abs(Number(valorRecebido) - total))}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={() => finalizar("NORMAL")}
            disabled={finalizando || carrinho.length === 0 || !eventoAberto}
            className="w-full text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            style={{ background: '#243757' }}
          >
            <CheckCircle size={18} />
            {finalizando ? "Finalizando..." : "Finalizar venda"}
          </button>
          <button
            onClick={() => setModalFiado(true)}
            disabled={finalizando || carrinho.length === 0 || !eventoAberto}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-sm"
          >
            Fiado
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-sand/20 flex flex-col">
      {/* Header */}
      <header className="text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md" style={{ background: '#243757' }}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <ShoppingCart size={20} className="shrink-0" />
          <span className="font-bold text-base sm:text-lg">PDV</span>
          {eventoAberto ? (
            <span className="text-xs bg-green-500 px-2 py-0.5 rounded-full truncate max-w-[120px] sm:max-w-none">
              {eventoAberto.nome}
            </span>
          ) : (
            <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full">Sem evento</span>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-sm text-brand-sand/70 hidden sm:block truncate max-w-[120px]">{usuario?.nome}</span>
          {usuario?.perfil === "ADMIN" && (
            <button onClick={() => navigate("/admin")} className="flex items-center gap-1.5 text-sm text-brand-sand/70 hover:text-white transition-colors">
              <LayoutDashboard size={16} />
              <span className="hidden sm:block">Painel</span>
            </button>
          )}
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-brand-sand/70 hover:text-white transition-colors">
            <LogOut size={16} />
            <span className="hidden sm:block">Sair</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 52px)" }}>
        {/* Produtos */}
        <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 gap-3">
          {/* Filtros */}
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/40" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-brand-tan rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
            <div className="relative">
              <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-brown/40" />
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                className="pl-9 pr-3 py-2.5 bg-white border border-brand-tan rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid de produtos */}
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {produtosFiltrados.length === 0 ? (
              <div className="text-center text-brand-brown/50 py-12">Nenhum produto encontrado</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {produtosFiltrados.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => adicionarAoCarrinho(produto)}
                    disabled={produto.estoqueAtual <= 0}
                    className={`bg-white rounded-xl p-3 sm:p-4 text-left border transition-all ${
                      produto.estoqueAtual <= 0
                        ? "opacity-50 cursor-not-allowed border-brand-tan/30"
                        : "border-brand-tan/40 hover:border-brand-teal hover:shadow-md active:scale-95"
                    }`}
                  >
                    <div className="rounded-lg mb-2 sm:mb-3 flex items-center justify-center h-16 sm:h-20 overflow-hidden bg-brand-sand/50">
                      {produto.imagemUrl ? (
                        <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <ShoppingCart size={20} className="text-brand-tan" />
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-brand-dark leading-tight line-clamp-2">{produto.nome}</p>
                    <p className="text-xs text-brand-brown/60 mt-0.5 hidden sm:block">{produto.categoriaNome}</p>
                    <p className="text-sm font-bold text-brand-teal mt-1 sm:mt-2">{formatarMoeda(produto.precoVenda)}</p>
                    <p className={`text-xs mt-0.5 ${produto.estoqueBaixo ? "text-red-500" : "text-brand-brown/50"}`}>
                      Estoque: {produto.estoqueAtual}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carrinho desktop */}
        <div className="hidden md:flex w-80 bg-white border-l border-brand-tan/40 flex-col">
          {carrinhoJSX}
        </div>
      </div>

      {/* Botão flutuante carrinho — mobile */}
      <div className="md:hidden fixed bottom-4 right-4 z-10">
        <button
          onClick={() => setCarrinhoAberto(true)}
          className="text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2 font-medium"
          style={{ background: '#243757' }}
        >
          <ShoppingCart size={20} />
          {totalItens > 0 && (
            <span className="bg-white text-brand-dark text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {totalItens}
            </span>
          )}
          <span>{formatarMoeda(total)}</span>
        </button>
      </div>

      {/* Painel carrinho mobile */}
      {carrinhoAberto && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCarrinhoAberto(false)} />
          <div className="relative bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]">
            {carrinhoJSX}
          </div>
        </div>
      )}

      {/* Modal Fiado */}
      {modalFiado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-4">Venda no fiado</h2>
            <p className="text-sm text-brand-brown/70 mb-3">
              Total: <span className="font-bold text-brand-teal">{formatarMoeda(total)}</span>
            </p>
            <label className="block text-sm font-medium text-brand-brown mb-1">Nome do cliente *</label>
            <div className="relative">
              <input
                value={clienteFiado}
                onChange={(e) => { setClienteFiado(e.target.value); setMostrarSugestoes(true); }}
                onKeyDown={(e) => e.key === "Enter" && finalizar("FIADO")}
                onFocus={() => setMostrarSugestoes(true)}
                placeholder="Nome de quem vai ficar devendo"
                className="w-full border border-brand-tan rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                autoFocus
              />
              {mostrarSugestoes && clientesFiado.filter((n) => n.toLowerCase().includes(clienteFiado.toLowerCase())).length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-brand-tan rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto">
                  {clientesFiado.filter((n) => n.toLowerCase().includes(clienteFiado.toLowerCase())).map((nome) => (
                    <button
                      key={nome}
                      type="button"
                      onClick={() => { setClienteFiado(nome); setMostrarSugestoes(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-sand transition-colors flex items-center justify-between"
                    >
                      <span className="text-brand-dark">{nome}</span>
                      <span className="text-xs text-orange-500 font-medium">fiado aberto</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setModalFiado(false); setMostrarSugestoes(false); }}
                className="px-4 py-2 text-sm text-brand-brown hover:bg-brand-sand/50 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => finalizar("FIADO")}
                disabled={finalizando}
                className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl"
              >
                {finalizando ? "Finalizando..." : "Confirmar fiado"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
