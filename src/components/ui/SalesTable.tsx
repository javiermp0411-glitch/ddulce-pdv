import { sampleSales } from '../../data/demo';
import { money } from '../../lib/format';

interface SalesTableProps {
  compact?: boolean;
}

export function SalesTable({ compact = false }: SalesTableProps) {
  const sales = compact ? sampleSales.slice(0, 3) : sampleSales;

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
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td><span className="folio">{sale.id}</span></td>
              <td>{sale.time}</td>
              <td>{sale.items}</td>
              <td><span className="status-pill">{sale.method}</span></td>
              <td className="align-right amount">{money(sale.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
