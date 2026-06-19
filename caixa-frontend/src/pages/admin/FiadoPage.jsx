import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, HandCoins, CheckCircle } from "lucide-react";

export default function FiadoPage() {
  const { eventoId } = useParams();
  const navigate = useNavigate();

  const [fiados, setFiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("abertos");
  const [modalPagamento, setModalPagamento] = useState(null);
  const [valorPagamento, setValorPagamento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const url =
          filtro === "abertos"
            ? `/api/fiado/evento/${eventoId}/abertos`
            : `/api/fiado/evento/${eventoId}`;
        const response = await api.get(url);
        setFiados(response.data);
      } catch (_error) {
        toast.error("Erro ao carregar fiados");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [eventoId, filtro]);

  const carregarFiados = async () => {
    try {
      const url =
        filtro === "abertos"
          ? `/api/fiado/evento/${eventoId}/abertos`
          : `/api/fiado/evento/${eventoId}`;
      const response = await api.get(url);
      setFiados(response.data);
    } catch (_error) {
      toast.error("Erro ao carregar fiados");
    }
  };

  const registrarPagamento = async () => {
    if (!valorPagamento || Number(valorPagamento) <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    setSalvando(true);
    try {
      await api.post(
        `/api/fiado/cliente/${eventoId}/pagamento?cliente=${encodeURIComponent(modalPagamento.clienteFiado)}`,
        {
          valor: Number(valorPagamento),
          observacao: observacao || null,
        },
      );
      toast.success("Pagamento registrado!");
      setModalPagamento(null);
      setValorPagamento("");
      setObservacao("");
      carregarFiados();
    } catch (error) {
      toast.error(error.response?.data?.erro || "Erro ao registrar pagamento");
    } finally {
      setSalvando(false);
    }
  };

  const formatarMoeda = (valor) =>
    Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const formatarDataHora = (data) =>
    new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalEmAberto = fiados
    .filter((f) => !f.quitado)
    .reduce((acc, f) => acc + Number(f.totalRestante), 0);

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/eventos")}
          className="p-2 text-brand-brown/50 hover:text-brand-brown hover:bg-brand-sand/50 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-brand-dark">
            Controle de Fiado
          </h1>
          <p className="text-brand-brown/70 text-sm mt-1">
            Gerencie as vendas no fiado
          </p>
        </div>
        {totalEmAberto > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-right">
            <p className="text-xs text-orange-600">Total em aberto</p>
            <p className="font-bold text-orange-700">
              {formatarMoeda(totalEmAberto)}
            </p>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFiltro("abertos")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filtro === "abertos"
              ? "bg-brand-dark text-white"
              : "bg-white text-brand-brown border border-brand-tan hover:bg-brand-sand/30"
          }`}
        >
          Em aberto
        </button>
        <button
          onClick={() => setFiltro("todos")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filtro === "todos"
              ? "bg-brand-dark text-white"
              : "bg-white text-brand-brown border border-brand-tan hover:bg-brand-sand/30"
          }`}
        >
          Todos
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-white rounded-xl p-8 text-center text-brand-brown/50">
          Carregando...
        </div>
      ) : fiados.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-brand-brown/50">
          Nenhum fiado encontrado
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {fiados.map((fiado) => (
            <div
              key={fiado.vendaId}
              className={`bg-white rounded-xl shadow-sm border p-6 ${
                fiado.quitado ? "border-green-100" : "border-orange-100"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      fiado.quitado ? "bg-green-100" : "bg-orange-100"
                    }`}
                  >
                    {fiado.quitado ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <HandCoins size={18} className="text-orange-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-dark">
                      {fiado.clienteFiado}
                    </p>
                    <p className="text-xs text-brand-brown/50">
                      {formatarDataHora(fiado.criadoEm)} · Venda #
                      {fiado.vendaId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-brown/50">Total da dívida</p>
                  <p className="font-bold text-brand-dark">
                    {formatarMoeda(fiado.valorTotal)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 bg-brand-sand/30 rounded-lg p-3">
                <div className="text-center">
                  <p className="text-xs text-brand-brown/50">Total</p>
                  <p className="font-semibold text-brand-dark">
                    {formatarMoeda(fiado.valorTotal)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-brand-brown/50">Pago</p>
                  <p className="font-semibold text-green-600">
                    {formatarMoeda(fiado.totalPago)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-brand-brown/50">Restante</p>
                  <p
                    className={`font-semibold ${fiado.quitado ? "text-green-600" : "text-orange-600"}`}
                  >
                    {formatarMoeda(fiado.totalRestante)}
                  </p>
                </div>
              </div>

              {/* Histórico de pagamentos */}
              {fiado.pagamentos.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-brand-brown/70 mb-2">
                    Pagamentos recebidos
                  </p>
                  <div className="flex flex-col gap-1">
                    {fiado.pagamentos.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-brand-brown/70">
                          {formatarDataHora(p.pagoEm)}
                        </span>
                        <span className="font-medium text-green-600">
                          + {formatarMoeda(p.valorPago)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!fiado.quitado && (
                <button
                  onClick={() => {
                    setModalPagamento(fiado);
                    setValorPagamento(String(fiado.totalRestante));
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Registrar pagamento
                </button>
              )}

              {fiado.quitado && (
                <div className="text-center text-sm text-green-600 font-medium">
                  ✓ Quitado
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal pagamento */}
      {modalPagamento && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-brand-dark mb-1">
              Registrar pagamento
            </h2>
            <p className="text-sm text-brand-brown/70 mb-4">
              Cliente:{" "}
              <span className="font-medium text-brand-dark">
                {modalPagamento.clienteFiado}
              </span>
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-brand-brown mb-1">
                  Valor recebido *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  className="w-full border border-brand-tan rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  autoFocus
                />
                <p className="text-xs text-brand-brown/50 mt-1">
                  Restante: {formatarMoeda(modalPagamento.totalRestante)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-brown mb-1">
                  Observação
                </label>
                <input
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Opcional"
                  className="w-full border border-brand-tan rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setModalPagamento(null);
                  setValorPagamento("");
                  setObservacao("");
                }}
                className="px-4 py-2 text-sm text-brand-brown hover:bg-brand-sand/50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={registrarPagamento}
                disabled={salvando}
                className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-lg"
              >
                {salvando ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
