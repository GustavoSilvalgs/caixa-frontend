import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/layout/AdminLayout";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { ShoppingCart, Package, CalendarDays, HandCoins } from "lucide-react";

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [dados, setDados] = useState({
    totalVendas: null,
    receitaEvento: null,
    totalProdutos: null,
    eventoAberto: null,
    totalFiado: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const [produtosRes, eventoRes] = await Promise.all([
          api.get("/api/produtos"),
          api.get("/api/eventos/aberto").catch(() => ({ data: null })),
        ]);

        const totalProdutos = produtosRes.data.length;
        const eventoAberto = eventoRes.data;

        let totalVendas = null;
        let receitaEvento = null;
        let totalFiado = null;

        if (eventoAberto) {
          const [vendasRes, fiadoRes] = await Promise.all([
            api.get(`/api/vendas/evento/${eventoAberto.id}`),
            api.get(`/api/fiado/evento/${eventoAberto.id}/abertos`),
          ]);

          const vendas = vendasRes.data.filter((v) => v.status === "CONCLUIDA");
          totalVendas = vendas.length;
          receitaEvento = vendas.reduce((acc, v) => acc + Number(v.total), 0);
          totalFiado = fiadoRes.data.length;
        }

        setDados({
          totalVendas,
          receitaEvento,
          totalProdutos,
          eventoAberto,
          totalFiado,
        });
      } catch (_error) {
        // silencioso
      } finally {
        setLoading(false);
      }
    };
    carregar();
  }, []);

  const formatarMoeda = (valor) =>
    Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const cards = [
    {
      label: "Vendas no evento",
      valor: loading ? "..." : (dados.totalVendas ?? "—"),
      sub: dados.eventoAberto
        ? `Receita: ${dados.receitaEvento !== null ? formatarMoeda(dados.receitaEvento) : "—"}`
        : "Nenhum evento aberto",
      icon: ShoppingCart,
      cor: "bg-brand-sand",
      iconCor: "text-brand-teal",
      onClick: dados.eventoAberto
        ? () => navigate(`/admin/relatorio/${dados.eventoAberto.id}`)
        : null,
    },
    {
      label: "Produtos ativos",
      valor: loading ? "..." : (dados.totalProdutos ?? "—"),
      sub: "No catálogo",
      icon: Package,
      cor: "bg-green-100",
      iconCor: "text-green-600",
      onClick: () => navigate("/admin/produtos"),
    },
    {
      label: "Evento aberto",
      valor: loading ? "..." : dados.eventoAberto ? "Sim" : "Não",
      sub: dados.eventoAberto ? dados.eventoAberto.nome : "Nenhum evento ativo",
      icon: CalendarDays,
      cor: "bg-yellow-100",
      iconCor: "text-yellow-600",
      onClick: () => navigate("/admin/eventos"),
    },
    {
      label: "Fiados em aberto",
      valor: loading ? "..." : (dados.totalFiado ?? "—"),
      sub: dados.eventoAberto ? "No evento atual" : "Nenhum evento aberto",
      icon: HandCoins,
      cor: "bg-red-100",
      iconCor: "text-red-600",
      onClick: dados.eventoAberto
        ? () => navigate(`/admin/fiado/${dados.eventoAberto.id}`)
        : null,
    },
  ];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-dark">
          Olá, {usuario?.nome} 👋
        </h1>
        <p className="text-brand-brown/70 mt-1">Bem-vindo ao painel administrativo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              onClick={card.onClick || undefined}
              className={`bg-white rounded-xl p-6 shadow-sm border border-brand-tan/40 transition-all ${
                card.onClick
                  ? "cursor-pointer hover:shadow-md hover:border-brand-teal/50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-brand-brown/70 text-sm">{card.label}</span>
                <div className={`${card.cor} p-2 rounded-lg`}>
                  <Icon size={18} className={card.iconCor} />
                </div>
              </div>
              <p className="text-2xl font-bold text-brand-dark">{card.valor}</p>
              <p className="text-xs text-brand-brown/50 mt-1 truncate">{card.sub}</p>
            </div>
          );
        })}
      </div>
      
      {/* Acesso rápido ao PDV — ADICIONE AQUI */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-brand-dark mb-4">
          Acesso rápido
        </h2>
        <button
          onClick={() => navigate("/pdv")}
          className="flex items-center gap-3 text-white px-6 py-4 rounded-xl font-medium transition-colors shadow-sm" style={{ background: '#243757' }}
        >
          <ShoppingCart size={22} />
          Abrir PDV
        </button>
      </div>
    </AdminLayout>
  );
}
