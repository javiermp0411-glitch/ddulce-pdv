import { useEffect, useState } from 'react';
import { supabase } from '../../db/supabase';
import { money } from '../../lib/format';
import { PageHeading } from '../../components/ui/PageHeading';

interface SaleRow {
  id: string;
  created_at: string;
  total: number;
  payment_method: string;
  sale_items: { product_name: string; quantity: number }[];
}

export function SalesPage() {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSales = async () => {
      const { data, error: loadError } = await supabase
        .from('sales')
        .select('id,created_at,total,payment_method,sale_items(product_name,quantity)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (loadError) setError('No se pudo cargar el historial de ventas. Revisa tu conexión y permisos.');
      else setSales((data ?? []) as SaleRow[]);
      setLoading(false);
    };
    void loadSales();
  }, []);

  return (
    <>
      <PageHeading eyebrow="Actividad" title="Ventas" description="Consulta las ventas registradas en caja." />
      {error && <p className="inline-feedback form-error" role="alert">{error}</p>}
      <section className="panel page-panel">
        <div className="panel-heading"><div><h2>Historial de ventas</h2><p>Ventas reales registradas desde el punto de venta.</p></div><span className="inventory-count">{sales.length} registros</span></div>
        <div className="table-scroll"><table>
          <thead><tr><th>Folio</th><th>Fecha y hora</th><th>Productos</th><th>Pago</th><th className="align-right">Total</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={5}>Cargando ventas…</td></tr>}
            {!loading && sales.map((sale) => <tr key={sale.id}>
              <td><span className="folio">{sale.id.slice(0, 8).toUpperCase()}</span></td>
              <td>{new Date(sale.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
              <td>{sale.sale_items.map((item) => `${item.quantity} × ${item.product_name}`).join(', ')}</td>
              <td><span className="status-pill">{sale.payment_method}</span></td>
              <td className="align-right amount">{money(sale.total)}</td>
            </tr>)}
            {!loading && !sales.length && !error && <tr><td colSpan={5}>Todavía no hay ventas registradas.</td></tr>}
          </tbody>
        </table></div>
      </section>
    </>
  );
}
