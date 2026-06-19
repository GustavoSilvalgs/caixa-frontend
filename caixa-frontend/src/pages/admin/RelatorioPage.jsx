import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../services/api";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  TrendingUp,
  ShoppingCart,
  HandCoins,
  Package,
  Tag,
  FileDown,
  Users,
} from "lucide-react";

export default function RelatorioPage() {
  const { eventoId } = useParams();
  const navigate = useNavigate();
  const [relatorio, setRelatorio] = useState(null);
  const [fiados, setFiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [relatorioRes, fiadosRes] = await Promise.all([
          api.get(`/api/relatorios/evento/${eventoId}`),
          api.get(`/api/fiado/evento/${eventoId}`),
        ]);
        setRelatorio(relatorioRes.data);
        setFiados(fiadosRes.data);
      } catch (_error) {
        toast.error("Erro ao carregar relatório");
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, [eventoId]);

  const formatarMoeda = (valor) =>
    Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const formatarData = (data) =>
    new Date(data + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const exportarPDF = () => {
    setExportando(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      let y = 0;

      const addPagina = () => {
        pdf.addPage();
        y = 15;
      };

      const checarPagina = (espaco = 20) => {
        if (y + espaco > 275) addPagina();
      };

      const addSecao = (titulo) => {
        checarPagina(20);
        pdf.setFillColor(55, 48, 163);
        pdf.rect(10, y, pageWidth - 20, 8, "F");
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.text(titulo, 14, y + 5.5);
        y += 13;
      };

      const addLinhaDivisoria = () => {
        pdf.setDrawColor(220, 220, 220);
        pdf.line(10, y, pageWidth - 10, y);
        y += 4;
      };

      // ── CABEÇALHO ──────────────────────────────────────────
      pdf.setFillColor(30, 27, 75);
      pdf.rect(0, 0, pageWidth, 30, "F");
      pdf.setFontSize(18);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.text(relatorio.eventoNome, 10, 13);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(165, 180, 252);
      pdf.text(`Data: ${formatarData(relatorio.eventoData)}`, 10, 22);
      pdf.text(
        `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
        pageWidth - 10,
        22,
        { align: "right" },
      );
      y = 38;

      // ── RESUMO GERAL ───────────────────────────────────────
      addSecao("RESUMO GERAL");

      const cards = [
        {
          label: "Total de vendas",
          valor: `${relatorio.totalVendas}`,
          sub: `${relatorio.totalVendasNormais} normais  |  ${relatorio.totalVendaFiado} fiado`,
          cor: [238, 242, 255],
        },
        {
          label: "Receita total",
          valor: formatarMoeda(relatorio.receitaTotal),
          sub: "Incluindo fiados",
          cor: [240, 253, 244],
        },
        {
          label: "Receita recebida",
          valor: formatarMoeda(relatorio.receitaRecebida),
          sub: "Já em caixa",
          cor: [239, 246, 255],
        },
        {
          label: "Lucro total",
          valor: formatarMoeda(relatorio.lucroTotal),
          sub: "Receita - custo",
          cor: [250, 245, 255],
        },
      ];

      const cardW = (pageWidth - 20 - 9) / 4;
      cards.forEach((card, i) => {
        const x = 10 + i * (cardW + 3);
        pdf.setFillColor(...card.cor);
        pdf.roundedRect(x, y, cardW, 22, 2, 2, "F");
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont("helvetica", "normal");
        pdf.text(card.label.toUpperCase(), x + 3, y + 5);
        pdf.setFontSize(11);
        pdf.setTextColor(30, 27, 75);
        pdf.setFont("helvetica", "bold");
        pdf.text(card.valor, x + 3, y + 13);
        pdf.setFontSize(7);
        pdf.setTextColor(130, 130, 130);
        pdf.setFont("helvetica", "normal");
        pdf.text(card.sub, x + 3, y + 19);
      });
      y += 28;

      // Formas de pagamento
      if (
        relatorio.receitaPorFormaPagamento &&
        Object.keys(relatorio.receitaPorFormaPagamento).length > 0
      ) {
        pdf.setFontSize(9);
        pdf.setTextColor(80, 80, 80);
        pdf.setFont("helvetica", "bold");
        pdf.text("Receita por forma de pagamento", 10, y);
        y += 6;
        const labels = {
          DINHEIRO: "Dinheiro",
          PIX: "Pix",
          CARTAO_DEBITO: "Cartão Débito",
          CARTAO_CREDITO: "Cartão Crédito",
        };
        Object.entries(relatorio.receitaPorFormaPagamento).forEach(
          ([forma, valor]) => {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(80, 80, 80);
            pdf.text(labels[forma] || forma, 12, y);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(30, 27, 75);
            pdf.text(formatarMoeda(valor), pageWidth - 12, y, {
              align: "right",
            });
            y += 6;
          },
        );
      }

      if (Number(relatorio.receitaPendenteFiado) > 0) {
        checarPagina(10);
        pdf.setFillColor(255, 243, 205);
        pdf.roundedRect(10, y, pageWidth - 20, 10, 2, 2, "F");
        pdf.setFontSize(9);
        pdf.setTextColor(146, 64, 14);
        pdf.setFont("helvetica", "bold");
        pdf.text("Fiado pendente (ainda não recebido)", 14, y + 6.5);
        pdf.text(
          formatarMoeda(relatorio.receitaPendenteFiado),
          pageWidth - 14,
          y + 6.5,
          { align: "right" },
        );
        y += 15;
      }

      // ── PRODUTOS MAIS VENDIDOS ─────────────────────────────
      addSecao("PRODUTOS MAIS VENDIDOS");

      const colVendidos = [10, 85, 130, 158, pageWidth - 10];
      pdf.setFillColor(224, 231, 255);
      pdf.rect(10, y, pageWidth - 20, 7, "F");
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(55, 48, 163);
      pdf.text("#  Produto", colVendidos[0] + 2, y + 5);
      pdf.text("Categoria", colVendidos[1], y + 5);
      pdf.text("Qtd", colVendidos[2], y + 5);
      pdf.text("Receita", colVendidos[3], y + 5);
      pdf.text("Lucro", colVendidos[4], y + 5, { align: "right" });
      y += 9;

      relatorio.produtosMaisVendidos.slice(0, 10).forEach((p, i) => {
        checarPagina(8);
        if (i % 2 === 0) {
          pdf.setFillColor(248, 249, 255);
          pdf.rect(10, y - 2, pageWidth - 20, 8, "F");
        }
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(50, 50, 50);
        pdf.text(`${i + 1}.  ${p.produtoNome}`, colVendidos[0] + 2, y + 4);
        pdf.text(p.categoriaNome, colVendidos[1], y + 4);
        pdf.text(`${p.quantidadeVendida} un.`, colVendidos[2], y + 4);
        pdf.text(formatarMoeda(p.receitaGerada), colVendidos[3], y + 4);
        pdf.setTextColor(21, 128, 61);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatarMoeda(p.lucroGerado), colVendidos[4], y + 4, {
          align: "right",
        });
        y += 8;
      });
      y += 4;

      // ── PRODUTOS MAIS LUCRATIVOS ───────────────────────────
      addSecao("PRODUTOS MAIS LUCRATIVOS");

      pdf.setFillColor(224, 231, 255);
      pdf.rect(10, y, pageWidth - 20, 7, "F");
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(55, 48, 163);
      pdf.text("#  Produto", colVendidos[0] + 2, y + 5);
      pdf.text("Categoria", colVendidos[1], y + 5);
      pdf.text("Qtd", colVendidos[2], y + 5);
      pdf.text("Receita", colVendidos[3], y + 5);
      pdf.text("Lucro", colVendidos[4], y + 5, { align: "right" });
      y += 9;

      relatorio.produtosMaisLucrativos.slice(0, 10).forEach((p, i) => {
        checarPagina(8);
        if (i % 2 === 0) {
          pdf.setFillColor(248, 249, 255);
          pdf.rect(10, y - 2, pageWidth - 20, 8, "F");
        }
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(50, 50, 50);
        pdf.text(`${i + 1}.  ${p.produtoNome}`, colVendidos[0] + 2, y + 4);
        pdf.text(p.categoriaNome, colVendidos[1], y + 4);
        pdf.text(`${p.quantidadeVendida} un.`, colVendidos[2], y + 4);
        pdf.text(formatarMoeda(p.receitaGerada), colVendidos[3], y + 4);
        pdf.setTextColor(21, 128, 61);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatarMoeda(p.lucroGerado), colVendidos[4], y + 4, {
          align: "right",
        });
        y += 8;
      });
      y += 4;

      // ── VENDAS POR CATEGORIA ───────────────────────────────
      addSecao("VENDAS POR CATEGORIA");

      const colCat = [10, 100, 135, pageWidth - 10];
      pdf.setFillColor(224, 231, 255);
      pdf.rect(10, y, pageWidth - 20, 7, "F");
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(55, 48, 163);
      pdf.text("Categoria", colCat[0] + 2, y + 5);
      pdf.text("Qtd vendida", colCat[1], y + 5);
      pdf.text("Receita", colCat[2], y + 5);
      pdf.text("Lucro", colCat[3], y + 5, { align: "right" });
      y += 9;

      relatorio.categorias.forEach((c, i) => {
        checarPagina(8);
        if (i % 2 === 0) {
          pdf.setFillColor(248, 249, 255);
          pdf.rect(10, y - 2, pageWidth - 20, 8, "F");
        }
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(50, 50, 50);
        pdf.text(c.categoriaNome, colCat[0] + 2, y + 4);
        pdf.text(`${c.quantidadeVendida} un.`, colCat[1], y + 4);
        pdf.text(formatarMoeda(c.receitaGerada), colCat[2], y + 4);
        pdf.setTextColor(21, 128, 61);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatarMoeda(c.lucroGerado), colCat[3], y + 4, {
          align: "right",
        });
        y += 8;
      });
      y += 4;

      // ── RESUMO POR OPERADOR ────────────────────────────────
      addSecao("RESUMO POR OPERADOR");

      const colOp = [10, 110, pageWidth - 10];
      pdf.setFillColor(224, 231, 255);
      pdf.rect(10, y, pageWidth - 20, 7, "F");
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(55, 48, 163);
      pdf.text("Operador", colOp[0] + 2, y + 5);
      pdf.text("Total de vendas", colOp[1], y + 5);
      pdf.text("Total arrecadado", colOp[2], y + 5, { align: "right" });
      y += 9;

      relatorio.resumoPorOperador.forEach((o, i) => {
        checarPagina(8);
        if (i % 2 === 0) {
          pdf.setFillColor(248, 249, 255);
          pdf.rect(10, y - 2, pageWidth - 20, 8, "F");
        }
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(50, 50, 50);
        pdf.text(o.operadorNome, colOp[0] + 2, y + 4);
        pdf.text(`${o.totalVendas} vendas`, colOp[1], y + 4);
        pdf.setTextColor(21, 128, 61);
        pdf.setFont("helvetica", "bold");
        pdf.text(formatarMoeda(o.totalArrecadado), colOp[2], y + 4, {
          align: "right",
        });
        y += 8;
      });
      y += 4;

      // ── FIADOS ─────────────────────────────────────────────
      addSecao("CONTROLE DE FIADO");

      const colFiado = [10, 85, 120, 155, pageWidth - 10];
      pdf.setFillColor(224, 231, 255);
      pdf.rect(10, y, pageWidth - 20, 7, "F");
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(55, 48, 163);
      pdf.text("Cliente", colFiado[0] + 2, y + 5);
      pdf.text("Total", colFiado[1], y + 5);
      pdf.text("Pago", colFiado[2], y + 5);
      pdf.text("Restante", colFiado[3], y + 5);
      pdf.text("Status", colFiado[4], y + 5, { align: "right" });
      y += 9;

      fiados.forEach((f, i) => {
        checarPagina(8);
        if (i % 2 === 0) {
          if (f.quitado) {
            pdf.setFillColor(240, 253, 244);
          } else {
            pdf.setFillColor(255, 251, 235);
          }
          pdf.rect(10, y - 2, pageWidth - 20, 8, "F");
        }
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(50, 50, 50);
        pdf.text(f.clienteFiado, colFiado[0] + 2, y + 4);
        pdf.setFont("helvetica", "normal");
        pdf.text(formatarMoeda(f.valorTotal), colFiado[1], y + 4);
        pdf.setTextColor(21, 128, 61);
        pdf.text(formatarMoeda(f.totalPago), colFiado[2], y + 4);
        if (f.quitado) {
          pdf.setTextColor(21, 128, 61); // verde
        } else {
          pdf.setTextColor(180, 60, 14); // laranja
        }
        pdf.setFont("helvetica", "bold");
        pdf.text(formatarMoeda(f.totalRestante), colFiado[3], y + 4);
        pdf.setTextColor(
          f.quitado ? 21 : 146,
          f.quitado ? 128 : 64,
          f.quitado ? 61 : 14,
        );
        pdf.text(f.quitado ? "Quitado" : "Em aberto", colFiado[4], y + 4, {
          align: "right",
        });
        y += 8;
      });

      // ── RODAPÉ ─────────────────────────────────────────────
      const totalPaginas = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        pdf.setPage(i);
        pdf.setFillColor(241, 245, 249);
        pdf.rect(0, 287, pageWidth, 10, "F");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          `Página ${i} de ${totalPaginas}  •  Sistema de Caixa  •  ${relatorio.eventoNome}`,
          pageWidth / 2,
          293,
          { align: "center" },
        );
      }

      pdf.save(`relatorio-${relatorio.eventoNome}.pdf`);
      toast.success("PDF exportado!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar PDF");
    } finally {
      setExportando(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-brand-brown/50">
          Carregando relatório...
        </div>
      </AdminLayout>
    );
  }

  if (!relatorio) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-brand-brown/50">
          Relatório não encontrado
        </div>
      </AdminLayout>
    );
  }

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
            {relatorio.eventoNome}
          </h1>
          <p className="text-brand-brown/70 text-sm mt-1">
            {formatarData(relatorio.eventoData)}
          </p>
        </div>
        <button
          onClick={exportarPDF}
          disabled={exportando}
          className="flex items-center gap-2 bg-brand-dark hover:bg-brand-teal disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <FileDown size={16} />
          {exportando ? "Exportando..." : "Exportar PDF"}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Cards resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand-tan/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-brand-brown/70">Total vendas</span>
              <div className="bg-brand-sand p-2 rounded-lg">
                <ShoppingCart size={16} className="text-brand-teal" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark">
              {relatorio.totalVendas}
            </p>
            <p className="text-xs text-brand-brown/50 mt-1">
              {relatorio.totalVendasNormais} normais ·{" "}
              {relatorio.totalVendaFiado} fiado
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand-tan/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-brand-brown/70">Receita total</span>
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp size={16} className="text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark">
              {formatarMoeda(relatorio.receitaTotal)}
            </p>
            <p className="text-xs text-brand-brown/50 mt-1">Incluindo fiados</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand-tan/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-brand-brown/70">Receita recebida</span>
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark">
              {formatarMoeda(relatorio.receitaRecebida)}
            </p>
            <p className="text-xs text-brand-brown/50 mt-1">Já em caixa</p>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-brand-tan/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-brand-brown/70">Lucro total</span>
              <div className="bg-purple-100 p-2 rounded-lg">
                <TrendingUp size={16} className="text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-brand-dark">
              {formatarMoeda(relatorio.lucroTotal)}
            </p>
            <p className="text-xs text-brand-brown/50 mt-1">Receita - custo</p>
          </div>
        </div>

        {/* Fiado pendente */}
        {Number(relatorio.receitaPendenteFiado) > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
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

        {/* Formas de pagamento */}
        {relatorio.receitaPorFormaPagamento &&
          Object.keys(relatorio.receitaPorFormaPagamento).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-brand-tan/40 overflow-x-auto">
              <div className="px-6 py-4 border-b border-brand-tan/40 flex items-center gap-2">
                <ShoppingCart size={18} className="text-brand-teal" />
                <h2 className="font-semibold text-brand-dark">
                  Receita por forma de pagamento
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(relatorio.receitaPorFormaPagamento).map(
                    ([forma, valor]) => {
                      const labels = {
                        DINHEIRO: {
                          label: "Dinheiro",
                          emoji: "💵",
                          cor: "bg-green-50 border-green-200 text-green-700",
                        },
                        PIX: {
                          label: "Pix",
                          emoji: "📱",
                          cor: "bg-blue-50 border-blue-200 text-blue-700",
                        },
                        CARTAO_DEBITO: {
                          label: "Cartão Débito",
                          emoji: "💳",
                          cor: "bg-purple-50 border-purple-200 text-purple-700",
                        },
                        CARTAO_CREDITO: {
                          label: "Cartão Crédito",
                          emoji: "💳",
                          cor: "bg-orange-50 border-orange-200 text-orange-700",
                        },
                      };
                      const info = labels[forma] || {
                        label: forma,
                        emoji: "💰",
                        cor: "bg-brand-sand/30 border-brand-tan text-brand-brown",
                      };
                      return (
                        <div
                          key={forma}
                          className={`rounded-xl p-4 border ${info.cor}`}
                        >
                          <p className="text-lg mb-1">{info.emoji}</p>
                          <p className="text-xs font-medium opacity-75">
                            {info.label}
                          </p>
                          <p className="text-lg font-bold mt-1">
                            {formatarMoeda(valor)}
                          </p>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Produtos mais vendidos */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-tan/40 overflow-x-auto">
          <div className="px-6 py-4 border-b border-brand-tan/40 flex items-center gap-2">
            <Package size={18} className="text-brand-teal" />
            <h2 className="font-semibold text-brand-dark">
              Produtos mais vendidos
            </h2>
          </div>
          <div className="p-4">
            {relatorio.produtosMaisVendidos.length === 0 ? (
              <p className="text-brand-brown/50 text-sm text-center py-4">
                Nenhuma venda registrada
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-tan/40">
                    <th className="text-left py-2 text-xs font-medium text-brand-brown/70">
                      #
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-brand-brown/70">
                      Produto
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-brand-brown/70">
                      Categoria
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Qtd
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Receita
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Lucro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.produtosMaisVendidos
                    .slice(0, 10)
                    .map((p, index) => (
                      <tr
                        key={p.produtoId}
                        className="border-b border-brand-tan/20 last:border-0 hover:bg-brand-sand/30"
                      >
                        <td className="py-3 text-sm font-bold text-brand-teal">
                          {index + 1}
                        </td>
                        <td className="py-3 text-sm font-medium text-brand-dark">
                          {p.produtoNome}
                        </td>
                        <td className="py-3">
                          <span className="text-xs bg-brand-sand text-brand-dark px-2 py-1 rounded-full">
                            {p.categoriaNome}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-brand-brown text-right">
                          {p.quantidadeVendida}
                        </td>
                        <td className="py-3 text-sm text-brand-dark text-right">
                          {formatarMoeda(p.receitaGerada)}
                        </td>
                        <td className="py-3 text-sm font-semibold text-green-600 text-right">
                          {formatarMoeda(p.lucroGerado)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Produtos mais lucrativos */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-tan/40 overflow-x-auto">
          <div className="px-6 py-4 border-b border-brand-tan/40 flex items-center gap-2">
            <TrendingUp size={18} className="text-green-600" />
            <h2 className="font-semibold text-brand-dark">
              Produtos mais lucrativos
            </h2>
          </div>
          <div className="p-4">
            {relatorio.produtosMaisLucrativos.length === 0 ? (
              <p className="text-brand-brown/50 text-sm text-center py-4">
                Nenhuma venda registrada
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-tan/40">
                    <th className="text-left py-2 text-xs font-medium text-brand-brown/70">
                      #
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-brand-brown/70">
                      Produto
                    </th>
                    <th className="text-left py-2 text-xs font-medium text-brand-brown/70">
                      Categoria
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Qtd
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Receita
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Lucro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.produtosMaisLucrativos
                    .slice(0, 10)
                    .map((p, index) => (
                      <tr
                        key={p.produtoId}
                        className="border-b border-brand-tan/20 last:border-0 hover:bg-brand-sand/30"
                      >
                        <td className="py-3 text-sm font-bold text-green-600">
                          {index + 1}
                        </td>
                        <td className="py-3 text-sm font-medium text-brand-dark">
                          {p.produtoNome}
                        </td>
                        <td className="py-3">
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                            {p.categoriaNome}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-brand-brown text-right">
                          {p.quantidadeVendida}
                        </td>
                        <td className="py-3 text-sm text-brand-dark text-right">
                          {formatarMoeda(p.receitaGerada)}
                        </td>
                        <td className="py-3 text-sm font-semibold text-green-600 text-right">
                          {formatarMoeda(p.lucroGerado)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Categorias */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-tan/40 overflow-x-auto">
          <div className="px-6 py-4 border-b border-brand-tan/40 flex items-center gap-2">
            <Tag size={18} className="text-purple-600" />
            <h2 className="font-semibold text-brand-dark">
              Vendas por categoria
            </h2>
          </div>
          <div className="p-4">
            {relatorio.categorias.length === 0 ? (
              <p className="text-brand-brown/50 text-sm text-center py-4">
                Nenhuma venda registrada
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-tan/40">
                    <th className="text-left py-2 text-xs font-medium text-brand-brown/70">
                      Categoria
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Qtd vendida
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Receita
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Lucro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.categorias.map((c) => (
                    <tr
                      key={c.categoriaId}
                      className="border-b border-brand-tan/20 last:border-0 hover:bg-brand-sand/30"
                    >
                      <td className="py-3 text-sm font-medium text-brand-dark">
                        {c.categoriaNome}
                      </td>
                      <td className="py-3 text-sm text-brand-brown text-right">
                        {c.quantidadeVendida}
                      </td>
                      <td className="py-3 text-sm text-brand-dark text-right">
                        {formatarMoeda(c.receitaGerada)}
                      </td>
                      <td className="py-3 text-sm font-semibold text-green-600 text-right">
                        {formatarMoeda(c.lucroGerado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Resumo por operador */}
        <div className="bg-white rounded-xl shadow-sm border border-brand-tan/40 overflow-x-auto">
          <div className="px-6 py-4 border-b border-brand-tan/40 flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <h2 className="font-semibold text-brand-dark">Resumo por operador</h2>
          </div>
          <div className="p-4">
            {relatorio.resumoPorOperador.length === 0 ? (
              <p className="text-brand-brown/50 text-sm text-center py-4">
                Nenhuma venda registrada
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-tan/40">
                    <th className="text-left py-2 text-xs font-medium text-brand-brown/70">
                      Operador
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Vendas
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Total arrecadado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {relatorio.resumoPorOperador.map((o) => (
                    <tr
                      key={o.operadorId}
                      className="border-b border-brand-tan/20 last:border-0 hover:bg-brand-sand/30"
                    >
                      <td className="py-3 text-sm font-medium text-brand-dark">
                        {o.operadorNome}
                      </td>
                      <td className="py-3 text-sm text-brand-brown text-right">
                        {o.totalVendas}
                      </td>
                      <td className="py-3 text-sm font-semibold text-brand-dark text-right">
                        {formatarMoeda(o.totalArrecadado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Fiados */}
        {fiados.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-brand-tan/40 overflow-x-auto">
            <div className="px-6 py-4 border-b border-brand-tan/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HandCoins size={18} className="text-orange-600" />
                <h2 className="font-semibold text-brand-dark">
                  Controle de fiado
                </h2>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-brand-brown/70">
                  {fiados.filter((f) => !f.quitado).length} em aberto
                </span>
                <span className="text-green-600 font-medium">
                  {fiados.filter((f) => f.quitado).length} quitados
                </span>
              </div>
            </div>
            <div className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-tan/40">
                    <th className="text-left py-2 text-xs font-medium text-brand-brown/70">
                      Cliente
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Total
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Pago
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Restante
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-brand-brown/70">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fiados.map((f) => (
                    <tr
                      key={f.vendaId}
                      className="border-b border-brand-tan/20 last:border-0 hover:bg-brand-sand/30"
                    >
                      <td className="py-3 text-sm font-medium text-brand-dark">
                        {f.clienteFiado}
                      </td>
                      <td className="py-3 text-sm text-brand-dark text-right">
                        {formatarMoeda(f.valorTotal)}
                      </td>
                      <td className="py-3 text-sm text-green-600 text-right">
                        {formatarMoeda(f.totalPago)}
                      </td>
                      <td className="py-3 text-sm font-semibold text-right">
                        <span
                          className={
                            f.quitado ? "text-green-600" : "text-orange-600"
                          }
                        >
                          {formatarMoeda(f.totalRestante)}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            f.quitado
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {f.quitado ? "Quitado" : "Em aberto"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
