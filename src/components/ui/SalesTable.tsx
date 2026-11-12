import { useEffect, useState } from 'react';
import { supabase } from '../../db/supabase';
import { money } from '../../lib/format';

interface RecentSale {
  id: string;
  created_at: string;
  total: number;
  payment_method: string;
  sale_items: { product_name: string; quantity: number }[];
}

interface SalesTableProps {
  compact?: boolean;
}

export function SalesTable({ compact = false }: SalesTableProps) {
  const [sales, setSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadRecentSales = async () => {
      const { data, error: loadError } = await supabase
        .from('sales')
        .select('id,created_at,total,payment_method,sale_items(product_name,quantity)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(compact ? 3 : 100);

      if (loadError) setError(true);
      else setSales((data ?? []) as RecentSale[]);
      setLoading(false);
    };

    void loadRecentSales();
  }, [compact]);

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Folio</th>
            <th>Hora</th>
            <th>Productos</th>
            <th>Pago</th>
            <th className="align-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={5}>Cargando ventas recientes…</td></tr>}
          {error && <tr><td colSpan={5}>No se pudieron cargar las ventas recientes.</td></tr>}
          {!loading && !error && sales.map((sale) => (
            <tr key={sale.id}>
              <td><span className="folio">{sale.id.slice(0, 8).toUpperCase()}</span></td>
              <td>{new Date(sale.created_at).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Mexico_City' })}</td>
              <td>{sale.sale_items.map((item) => `${item.quantity > 1 ? `${item.quantity} × ` : ''}${item.product_name}`).join(', ') || '—'}</td>
              <td><span className="status-pill">{sale.payment_method}</span></td>
              <td className="align-right amount">{money(sale.total)}</td>
            </tr>
          ))}
          {!loading && !error && !sales.length && <tr><td colSpan={5}>Todavía no hay ventas completadas.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
