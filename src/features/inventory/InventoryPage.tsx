import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { supabase } from '../../db/supabase';
import { money } from '../../lib/format';
import { PageHeading } from '../../components/ui/PageHeading';

type MovementType = 'entry' | 'waste' | 'adjustment';

interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  variant: string;
  unit_label: string;
  sale_price: number | null;
  purchase_cost: number | null;
  purchase_presentation: string | null;
  stock: number;
  low_stock_threshold: number;
  active: boolean;
}

interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: MovementType | 'sale';
  quantity_delta: number;
  note: string | null;
  created_at: string;
}

const movementLabels: Record<MovementType | 'sale', string> = {
  entry: 'Entrada',
  waste: 'Merma',
  adjustment: 'Ajuste',
  sale: 'Venta',
};

interface InventoryPageProps {
  canAdjust: boolean;
}

export function InventoryPage({ canAdjust }: InventoryPageProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [movementType, setMovementType] = useState<MovementType>('entry');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadInventory = useCallback(async () => {
    setLoading(true);
    const [{ data: productRows, error: productError }, { data: movementRows, error: movementError }] = await Promise.all([
      supabase.from('inventory_products').select('id,name,category,variant,unit_label,sale_price,purchase_cost,purchase_presentation,stock,low_stock_threshold,active').eq('active', true).order('category').order('name').order('variant'),
      supabase.from('inventory_movements').select('id,product_id,movement_type,quantity_delta,note,created_at').order('created_at', { ascending: false }).limit(30),
    ]);

    if (productError || movementError) {
      setError('No se pudo cargar el almacén. Verifica tu conexión y tus permisos.');
      setLoading(false);
      return;
    }

    const nextProducts = (productRows ?? []) as InventoryProduct[];
    setProducts(nextProducts);
    setMovements((movementRows ?? []) as InventoryMovement[]);
    setSelectedProduct((current) => current || nextProducts[0]?.id || '');
    setError('');
    setLoading(false);
  }, []);

  useEffect(() => { void loadInventory(); }, [loadInventory]);

  const categories = useMemo(() => ['Todos', ...new Set(products.map((product) => product.category))], [products]);
  const visibleProducts = products.filter((product) => filter === 'Todos' || product.category === filter);
  const lowStockCount = products.filter((product) => product.stock <= product.low_stock_threshold).length;
  const productNames = new Map(products.map((product) => [product.id, `${product.name}${product.variant ? ` · ${product.variant}` : ''}`]));

  const submitMovement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(quantity);
    const product = products.find((item) => item.id === selectedProduct);
    if (!product || !Number.isInteger(amount) || amount < (movementType === 'adjustment' ? 0 : 1)) {
      setError('Ingresa una cantidad entera mayor que cero.');
      return;
    }

    let delta = amount;
    if (movementType === 'waste') delta = -amount;
    if (movementType === 'adjustment') delta = amount - product.stock;
    if (delta === 0) {
      setError('La existencia ya coincide con el ajuste solicitado.');
      return;
    }

    setSaving(true);
    setError('');
    setFeedback('');
    const { error: insertError } = await supabase.from('inventory_movements').insert({
      product_id: product.id,
      movement_type: movementType,
      quantity_delta: delta,
      note: note.trim() || null,
    });

    if (insertError) {
      setError(insertError.message.includes('23514') || insertError.message.toLowerCase().includes('existencia')
        ? 'No se puede dejar una existencia negativa.'
        : 'No se pudo guardar el movimiento. Revisa tu permiso e inténtalo de nuevo.');
      setSaving(false);
      return;
    }

    setFeedback(`${movementLabels[movementType]} registrada para ${product.name}${product.variant ? ` · ${product.variant}` : ''}.`);
    setQuantity('1');
    setNote('');
    await loadInventory();
    setSaving(false);
  };

  return (
    <>
      <PageHeading eyebrow="Existencias" title="Almacén" description="Controla productos, presentaciones y movimientos de inventario." />

      <div className="inventory-summary">
        <div><span>Productos y variantes</span><strong>{products.length}</strong></div>
        <div className={lowStockCount ? 'inventory-summary-alert' : ''}><span>En nivel bajo</span><strong>{lowStockCount}</strong></div>
        <p>Alerta cuando haya <strong>5 piezas o menos</strong>. Los insumos se cuentan por presentación completa.</p>
      </div>

      {error && <p className="inline-feedback form-error" role="alert">{error}</p>}
      {feedback && <p className="inline-feedback movement-feedback" role="status">{feedback}</p>}

      {canAdjust && <section className="panel page-panel inventory-movement-panel">
        <div className="panel-heading"><div><h2>Registrar movimiento</h2><p>Las entradas, mermas y ajustes quedan guardados con fecha y usuario.</p></div></div>
        <form className="inventory-movement-form" onSubmit={submitMovement}>
          <label>Producto o insumo
            <select required value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}{product.variant ? ` · ${product.variant}` : ''} ({product.stock} {product.unit_label})</option>)}
            </select>
          </label>
          <label>Tipo de movimiento
            <select value={movementType} onChange={(event) => setMovementType(event.target.value as MovementType)}>
              <option value="entry">Entrada</option><option value="waste">Merma</option><option value="adjustment">Ajustar existencia a</option>
            </select>
          </label>
          <label>{movementType === 'adjustment' ? 'Existencia contada' : 'Cantidad'}
            <input type="number" min={movementType === 'adjustment' ? '0' : '1'} step="1" required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label>Nota (opcional)
            <input maxLength={160} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej. compra o motivo del ajuste" />
          </label>
          <button className="button button-primary" type="submit" disabled={saving || loading || products.length === 0}>{saving ? 'Guardando…' : 'Guardar movimiento'}</button>
        </form>
      </section>}

      <section className="panel page-panel inventory-list-panel">
        <div className="panel-heading">
          <div><h2>Existencias actuales</h2><p>Los costos son de compra por unidad o presentación y no son precios de venta.</p></div>
          <span className="inventory-count">{visibleProducts.length} artículos</span>
        </div>
        <div className="category-tabs inventory-category-tabs" role="group" aria-label="Filtrar por categoría">
          {categories.map((category) => <button key={category} className={filter === category ? 'selected' : ''} onClick={() => setFilter(category)}>{category}</button>)}
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Producto</th><th>Categoría</th><th>Existencia</th><th>Costo de compra</th><th>Precio de venta</th><th>Estado</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6}>Cargando inventario…</td></tr> : visibleProducts.map((product) => {
                const isLow = product.stock <= product.low_stock_threshold;
                return <tr key={product.id}>
                  <td className="product-cell">{product.name}<small className="inventory-subtext">{product.variant || product.purchase_presentation}</small></td>
                  <td>{product.category}<small className="inventory-subtext">{product.purchase_presentation}</small></td>
                  <td><strong>{product.stock}</strong> {product.unit_label}</td>
                  <td>{product.purchase_cost === null ? '—' : money(product.purchase_cost)}<small className="inventory-subtext">{product.purchase_presentation}</small></td>
                  <td>{product.sale_price === null ? 'Sin definir' : money(product.sale_price)}</td>
                  <td><span className={isLow ? 'stock-pill low' : 'stock-pill'}>{isLow ? 'Stock bajo' : 'Disponible'}</span></td>
                </tr>;
              })}
              {!loading && visibleProducts.length === 0 && <tr><td colSpan={6}>No hay artículos en esta categoría.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel page-panel inventory-history-panel">
        <div className="panel-heading"><div><h2>Movimientos recientes</h2><p>Últimos 30 registros; las existencias iniciales se tomaron como saldo de apertura.</p></div></div>
        <div className="table-scroll"><table>
          <thead><tr><th>Fecha</th><th>Producto</th><th>Movimiento</th><th>Cambio</th><th>Nota</th></tr></thead>
          <tbody>{movements.map((movement) => <tr key={movement.id}>
            <td>{new Date(movement.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
            <td>{productNames.get(movement.product_id) ?? movement.product_id}</td>
            <td>{movementLabels[movement.movement_type]}</td>
            <td>{movement.quantity_delta > 0 ? '+' : ''}{movement.quantity_delta}</td>
            <td>{movement.note || '—'}</td>
          </tr>)}
          {!loading && movements.length === 0 && <tr><td colSpan={5}>Aún no hay movimientos registrados.</td></tr>}</tbody>
        </table></div>
      </section>
    </>
  );
}
