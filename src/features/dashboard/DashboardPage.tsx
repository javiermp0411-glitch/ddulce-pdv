import { useState } from 'react';
import { dashboardTotals, topProducts } from '../../data/demo';
import type { Period, Section } from '../../types/app';
import { DemoNotice } from '../../components/ui/DemoNotice';
import { PageHeading } from '../../components/ui/PageHeading';
import { SalesTable } from '../../components/ui/SalesTable';
import { StatCard } from '../../components/ui/StatCard';

interface DashboardPageProps {
  onNavigate: (section: Section) => void;
}

const periods: Period[] = ['Hoy', 'Esta semana', 'Este mes'];

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [period, setPeriod] = useState<Period>('Hoy');
  const totals = dashboardTotals[period];

  return (
    <>
      <PageHeading
        eyebrow="Resumen del negocio"
        title="¡Hola, Daylú!"
        description="Así va tu paletería. Aquí tienes el resumen de actividad."
      >
        <div className="period-switch" role="group" aria-label="Periodo del resumen">
          {periods.map((item) => (
            <button
              key={item}
              className={period === item ? 'selected' : ''}
              onClick={() => setPeriod(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </PageHeading>

      <DemoNotice />

      <div className="stat-grid">
        <StatCard label={`Ventas · ${period.toLowerCase()}`} value={totals.sales} change="↗ 12%" hint="vs. periodo anterior" icon="₊" tone="rose" />
        <StatCard label="Transacciones" value={totals.count} change="↗ 8%" hint="ventas registradas" icon="▣" tone="lime" />
        <StatCard label="Venta promedio" value={totals.average} change="↗ 3%" hint="por compra" icon="◉" tone="peach" />
        <StatCard label="Gastos registrados" value={totals.expenses} change="Este periodo" hint="salidas de dinero" icon="↘" tone="cream" />
      </div>

      <div className="content-grid dashboard-grid">
        <section className="panel sales-chart-panel">
          <div className="panel-heading">
            <div><h2>Ventas</h2><p>Actividad durante {period.toLowerCase()}</p></div>
            <span className="chart-total">{totals.sales}</span>
          </div>
          <div className="chart" aria-label={`Gráfica ilustrativa de ventas para ${period}`} role="img">
            <div className="chart-guides"><i>$600</i><i>$400</i><i>$200</i><i>$0</i></div>
            <div className="chart-bars">
              {totals.bars.map((height, index) => (
                <div className="chart-column" key={index}>
                  <span className={index === 8 ? 'chart-bar highlight' : 'chart-bar'} style={{ height: `${height}%` }} />
                  <small>{index % 3 === 0 ? `${9 + index}h` : ''}</small>
                </div>
              ))}
            </div>
          </div>
          <p className="chart-footnote">Gráfica ilustrativa · integraremos los datos reales después.</p>
        </section>

        <section className="panel top-products-panel">
          <div className="panel-heading">
            <div><h2>Lo más vendido</h2><p>Productos destacados</p></div>
            <span className="round-icon">✳</span>
          </div>
          {topProducts.map((product, index) => (
            <div className="product-rank" key={product.name}>
              <span className="rank-number">0{index + 1}</span>
              <span className="product-emoji" aria-hidden="true">{product.emoji}</span>
              <span className="rank-name">{product.name}<small>{product.amount}</small></span>
              <span className="rank-track"><i style={{ width: `${100 - index * 18}%` }} /></span>
            </div>
          ))}
        </section>
      </div>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div><h2>Ventas recientes</h2><p>Movimientos registrados en caja</p></div>
          <button className="text-button" onClick={() => onNavigate('sales')}>Ver todas <span>→</span></button>
        </div>
        <SalesTable compact />
      </section>
    </>
  );
}
