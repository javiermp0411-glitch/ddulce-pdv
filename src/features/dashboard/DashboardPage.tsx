import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../db/supabase';
import { money } from '../../lib/format';
import { dashboardTotals, topProducts } from '../../data/demo';
import type { Period, Section } from '../../types/app';
import { PageHeading } from '../../components/ui/PageHeading';
import { SalesTable } from '../../components/ui/SalesTable';
import { StatCard } from '../../components/ui/StatCard';

interface DashboardPageProps {
  onNavigate: (section: Section) => void;
}

const periods: Period[] = ['Hoy', 'Esta semana', 'Este mes'];
const businessTimeZone = 'America/Mexico_City';

function getBusinessDayRange(now = new Date()) {
  const dateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: businessTimeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const getPart = (type: string) => Number(dateParts.find((part) => part.type === type)?.value);

  const localMidnightAsUtc = (year: number, month: number, day: number) => {
    const utcGuess = Date.UTC(year, month - 1, day);
    const localParts = new Intl.DateTimeFormat('en-US', {
      timeZone: businessTimeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(utcGuess));
    const part = (type: string) => Number(localParts.find((entry) => entry.type === type)?.value);
    const localTimeAsUtc = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'));
    return new Date(utcGuess - (localTimeAsUtc - utcGuess));
  };

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    start: localMidnightAsUtc(year, month, day),
    end: localMidnightAsUtc(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate()),
  };
}

interface DailySales {
  total: number;
  count: number;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [period, setPeriod] = useState<Period>('Hoy');
  const [dailySales, setDailySales] = useState<DailySales>({ total: 0, count: 0 });
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState('');
  const totals = dashboardTotals[period];

  const loadDailySales = useCallback(async () => {
    const { start, end } = getBusinessDayRange();
    const rows: { total: number }[] = [];
    const pageSize = 1000;

    for (let from = 0; ; from += pageSize) {
      const { data, error: loadError } = await supabase
        .from('sales')
        .select('total')
        .eq('status', 'completed')
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);

      if (loadError) {
        setDailyError('No se pudieron cargar las ventas de hoy.');
        setDailyLoading(false);
        return;
      }

      rows.push(...(data ?? []) as { total: number }[]);
      if (!data || data.length < pageSize) break;
    }

    setDailySales({
      total: rows.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
      count: rows.length,
    });
    setDailyError('');
    setDailyLoading(false);
  }, []);

  useEffect(() => {
    void loadDailySales();
    const nextMidnight = getBusinessDayRange().end.getTime();
    const midnightRefresh = window.setTimeout(() => void loadDailySales(), Math.max(1000, nextMidnight - Date.now() + 500));
    const periodicRefresh = window.setInterval(() => void loadDailySales(), 60_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadDailySales();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearTimeout(midnightRefresh);
      window.clearInterval(periodicRefresh);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [loadDailySales]);

  const liveToday = period === 'Hoy';
  const salesValue = liveToday ? (dailyLoading ? '…' : dailyError ? '—' : money(dailySales.total)) : totals.sales;
  const transactionValue = liveToday ? (dailyLoading ? '…' : dailyError ? '—' : String(dailySales.count)) : totals.count;
  const averageValue = liveToday
    ? (dailyLoading ? '…' : dailyError ? '—' : money(dailySales.count ? dailySales.total / dailySales.count : 0))
    : totals.average;

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

      <p className="demo-notice"><span aria-hidden="true">✿</span>Hoy, ventas, transacciones y ventas recientes son reales · Semana, mes, gastos, gráfica y productos destacados son demostraciones.</p>
      {dailyError && <p className="inline-feedback form-error" role="alert">{dailyError} Se actualizará al volver a abrir esta pantalla.</p>}

      <div className="stat-grid">
        <StatCard label={`Ventas · ${period.toLowerCase()}`} value={salesValue} change={liveToday ? 'Supabase' : 'Muestra'} hint={liveToday ? 'ventas completadas' : 'dato de demostración'} icon="₊" tone="rose" />
        <StatCard label="Transacciones" value={transactionValue} change={liveToday ? 'Hoy' : 'Muestra'} hint={liveToday ? 'ventas completadas' : 'dato de demostración'} icon="▣" tone="lime" />
        <StatCard label="Venta promedio" value={averageValue} change={liveToday ? 'Hoy' : 'Muestra'} hint={liveToday ? 'por compra completada' : 'dato de demostración'} icon="◉" tone="peach" />
        <StatCard label="Gastos registrados" value={totals.expenses} change="Este periodo" hint="salidas de dinero" icon="↘" tone="cream" />
      </div>

      <div className="content-grid dashboard-grid">
        <section className="panel sales-chart-panel">
          <div className="panel-heading">
            <div><h2>Ventas</h2><p>Actividad durante {period.toLowerCase()}</p></div>
            <span className="chart-total">Muestra</span>
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
          <p className="chart-footnote">Gráfica ilustrativa · no representa las ventas reales.</p>
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
          <div><h2>Ventas recientes</h2><p>Últimas ventas completadas en caja</p></div>
          <button className="text-button" onClick={() => onNavigate('sales')}>Ver todas <span>→</span></button>
        </div>
        <SalesTable compact />
      </section>
    </>
  );
}
