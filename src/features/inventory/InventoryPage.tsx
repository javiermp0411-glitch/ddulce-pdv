import { useState } from 'react';
import { products } from '../../data/demo';
import { DemoNotice } from '../../components/ui/DemoNotice';
import { PageHeading } from '../../components/ui/PageHeading';

export function InventoryPage() {
  const [stock, setStock] = useState(() => products.map(({ id, name, category, stock: quantity }) => ({ id, name, category, quantity })));
  const [movement, setMovement] = useState('');

  const adjustStock = (id: string, amount: number) => {
    setStock((current) => current.map((item) => item.id === id
      ? { ...item, quantity: Math.max(0, item.quantity + amount) }
      : item));
    setMovement(amount > 0 ? 'Entrada de demostración aplicada.' : 'Salida de demostración aplicada.');
  };

  return (
    <>
      <PageHeading eyebrow="Existencias" title="Almacén" description="Revisa existencias y registra movimientos de entrada o salida." />
      <DemoNotice />
      {movement && <p className="inline-feedback movement-feedback" role="status">{movement} El cambio solo vive en esta sesión.</p>}

      <section className="panel page-panel">
        <div className="panel-heading">
          <div><h2>Inventario de productos</h2><p>Existencias de muestra · usa los botones para probar movimientos.</p></div>
          <span className="inventory-count">{stock.length} productos</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Producto</th><th>Categoría</th><th>Existencia</th><th>Estado</th><th className="align-right">Movimiento demo</th></tr></thead>
            <tbody>
              {stock.map((item) => (
                <tr key={item.id}>
                  <td className="product-cell">{item.name}</td>
                  <td>{item.category}</td>
                  <td><strong>{item.quantity}</strong> pzas.</td>
                  <td><span className={item.quantity <= 12 ? 'stock-pill low' : 'stock-pill'}>{item.quantity <= 12 ? 'Resurtir pronto' : 'Disponible'}</span></td>
                  <td className="align-right movement-actions">
                    <button aria-label={`Registrar entrada de ${item.name}`} onClick={() => adjustStock(item.id, 1)}>＋</button>
                    <button aria-label={`Registrar salida de ${item.name}`} disabled={item.quantity === 0} onClick={() => adjustStock(item.id, -1)}>−</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
