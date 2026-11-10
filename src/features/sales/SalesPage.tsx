import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../db/supabase';
import { money } from '../../lib/format';
import { PageHeading } from '../../components/ui/PageHeading';

interface SaleItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  stock_quantity: number;
  unit_price: number;
  line_total: number;
}

interface SaleRow {
  id: string;
  created_at: string;
  total: number;
  payment_method: string;
  status: 'completed' | 'cancelled';
  cancellation_reason: string | null;
  edited_at: string | null;
  sale_items: SaleItem[];
}

interface ProductOption {
  id: string;
  name: string;
  category: string;
  variant: string;
  sale_price: number;
  sale_quantity: number;
}

interface DraftItem {
  key: string;
  lineId?: string;
  productId: string | null;
  quantity: number;
  prepared: boolean;
  unitPrice: number;
  originalProductId: string | null;
  originalPrepared: boolean;
  productName: string;
}

interface EditState {
  sale: SaleRow;
  items: DraftItem[];
  paymentMethod: string;
  reason: string;
  saving: boolean;
  error: string;
}

const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia'];
const optionLabel = (product: ProductOption) => `${product.name}${product.variant ? ` · ${product.variant}` : ''}`;
const isPreparedItem = (item: SaleItem) => item.product_name.endsWith(' · Preparada');

interface SalesPageProps {
  canManage: boolean;
}

export function SalesPage({ canManage }: SalesPageProps) {
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<EditState | null>(null);
  const [cancelSale, setCancelSale] = useState<SaleRow | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelSaving, setCancelSaving] = useState(false);

  const loadSales = useCallback(async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from('sales')
      .select('id,created_at,total,payment_method,status,cancellation_reason,edited_at,sale_items(id,product_id,product_name,quantity,stock_quantity,unit_price,line_total)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (loadError) setError('No se pudo cargar el historial de ventas. Revisa tu conexión y permisos.');
    else {
      setSales((data ?? []) as SaleRow[]);
      setError('');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSales();
    if (canManage) {
      void supabase.from('inventory_products')
        .select('id,name,category,variant,sale_price,sale_quantity')
        .eq('active', true).eq('sale_enabled', true).not('sale_price', 'is', null)
        .order('category').order('name').order('variant')
        .then(({ data }) => setProducts((data ?? []) as ProductOption[]));
    }
  }, [canManage, loadSales]);

  const beginEdit = (sale: SaleRow) => {
    setEdit({
      sale,
      items: sale.sale_items.map((item) => {
        const prepared = isPreparedItem(item);
        return {
          key: item.id,
          lineId: item.id,
          productId: item.product_id,
          quantity: item.quantity,
          prepared,
          unitPrice: item.unit_price,
          originalProductId: item.product_id,
          originalPrepared: prepared,
          productName: item.product_name,
        };
      }),
      paymentMethod: sale.payment_method,
      reason: '',
      saving: false,
      error: '',
    });
  };

  const unitPriceFor = (item: DraftItem) => {
    if (item.lineId && item.productId === item.originalProductId && item.prepared === item.originalPrepared) return item.unitPrice;
    if (item.productId === null) return item.unitPrice;
    const product = products.find((entry) => entry.id === item.productId);
    return (product?.sale_price ?? item.unitPrice) + (item.prepared ? 5 : 0);
  };

  const editTotal = edit?.items.reduce((sum, item) => sum + unitPriceFor(item) * item.quantity, 0) ?? 0;

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!edit || edit.saving) return;
    setEdit({ ...edit, saving: true, error: '' });
    const { error: saveError } = await supabase.rpc('edit_sale', {
      p_sale_id: edit.sale.id,
      p_payment_method: edit.paymentMethod,
      p_reason: edit.reason.trim(),
      p_items: edit.items.map((item) => ({
        ...(item.lineId ? { line_id: item.lineId } : {}),
        product_id: item.productId,
        quantity: item.quantity,
        prepared: item.prepared,
      })),
    });
    if (saveError) {
      setEdit({ ...edit, saving: false, error: saveError.message || 'No se pudo guardar la corrección.' });
      return;
    }
    setEdit(null);
    await loadSales();
  };

  const confirmCancel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cancelSale || cancelSaving) return;
    setCancelSaving(true);
    setCancelError('');
    const { error: cancelRequestError } = await supabase.rpc('cancel_sale', {
      p_sale_id: cancelSale.id,
      p_reason: cancelReason.trim(),
    });
    if (cancelRequestError) {
      setCancelError(cancelRequestError.message || 'No se pudo cancelar la venta.');
      setCancelSaving(false);
      return;
    }
    setCancelSale(null);
    setCancelReason('');
    setCancelSaving(false);
    await loadSales();
  };

  return (
    <>
      <PageHeading eyebrow="Actividad" title="Ventas" description="Consulta las ventas registradas en caja." />
      {error && <p className="inline-feedback form-error" role="alert">{error}</p>}
      <section className="panel page-panel">
        <div className="panel-heading"><div><h2>Historial de ventas</h2><p>Las correcciones y cancelaciones quedan registradas.</p></div><span className="inventory-count">{sales.length} registros</span></div>
        <div className="table-scroll"><table>
          <thead><tr><th>Folio</th><th>Fecha y hora</th><th>Productos</th><th>Pago</th><th>Estado</th><th className="align-right">Total</th>{canManage && <th>Acciones</th>}</tr></thead>
          <tbody>
            {loading && <tr><td colSpan={canManage ? 7 : 6}>Cargando ventas…</td></tr>}
            {!loading && sales.map((sale) => <tr key={sale.id}>
              <td><span className="folio">{sale.id.slice(0, 8).toUpperCase()}</span></td>
              <td>{new Date(sale.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
              <td>{sale.sale_items.map((item) => `${item.quantity} × ${item.product_name}`).join(', ') || '—'}{sale.status === 'cancelled' && sale.cancellation_reason && <small className="sale-cancel-reason">Motivo: {sale.cancellation_reason}</small>}</td>
              <td><span className="status-pill">{sale.payment_method}</span></td>
              <td><span className={sale.status === 'cancelled' ? 'sale-status cancelled' : sale.edited_at ? 'sale-status edited' : 'sale-status'}>{sale.status === 'cancelled' ? 'Cancelada' : sale.edited_at ? 'Corregida' : 'Completada'}</span></td>
              <td className="align-right amount">{money(sale.total)}</td>
              {canManage && <td><div className="sale-actions">
                {sale.status === 'completed' && <>
                  <button className="button button-secondary" onClick={() => beginEdit(sale)}>Editar</button>
                  <button className="button button-danger" onClick={() => { setCancelSale(sale); setCancelReason(''); setCancelError(''); }}>Cancelar</button>
                </>}
              </div></td>}
            </tr>)}
            {!loading && !sales.length && !error && <tr><td colSpan={canManage ? 7 : 6}>Todavía no hay ventas registradas.</td></tr>}
          </tbody>
        </table></div>
      </section>

      {edit && <div className="sale-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !edit.saving) setEdit(null); }}>
        <form className="sale-dialog" role="dialog" aria-modal="true" aria-labelledby="sale-edit-title" onSubmit={saveEdit}>
          <button className="sale-dialog-close" type="button" aria-label="Cerrar" disabled={edit.saving} onClick={() => setEdit(null)}>×</button>
          <p className="eyebrow">Corrección de venta</p>
          <h2 id="sale-edit-title">Editar · {edit.sale.id.slice(0, 8).toUpperCase()}</h2>
          <p className="sale-dialog-description">Los productos descontarán o devolverán existencias automáticamente. Los precios unitarios no se editan.</p>
          <div className="sale-edit-lines">
            {edit.items.map((item) => {
              const selectedProduct = products.find((product) => product.id === item.productId);
              const isClothing = item.productId === null;
              return <div className="sale-edit-line" key={item.key}>
                <div className="sale-edit-product">
                  {isClothing ? <span className="sale-clothing-label">{item.productName}<small>Precio registrado: {money(item.unitPrice)}</small></span> : <>
                    <select aria-label="Producto" value={item.productId ?? ''} onChange={(event) => setEdit({ ...edit, items: edit.items.map((row) => row.key === item.key ? { ...row, productId: event.target.value, prepared: false } : row) })}>
                      {!products.some((product) => product.id === item.productId) && <option value={item.productId ?? ''}>{item.productName}</option>}
                      {products.map((product) => <option key={product.id} value={product.id}>{optionLabel(product)} · {money(product.sale_price)}</option>)}
                    </select>
                    {selectedProduct?.category === 'Paletas' && selectedProduct.name === 'Paleta de agua' && <label className="sale-prepared-check"><input type="checkbox" checked={item.prepared} onChange={(event) => setEdit({ ...edit, items: edit.items.map((row) => row.key === item.key ? { ...row, prepared: event.target.checked } : row) })} /> Preparada</label>}
                  </>}
                  <small>{money(unitPriceFor(item))} c/u</small>
                </div>
                <label className="sale-edit-quantity">Cantidad<input aria-label="Cantidad" type="number" min="1" step="1" value={item.quantity} onChange={(event) => setEdit({ ...edit, items: edit.items.map((row) => row.key === item.key ? { ...row, quantity: Math.max(1, Number(event.target.value) || 1) } : row) })} /></label>
                <button className="sale-line-remove" type="button" aria-label="Quitar producto de la venta" onClick={() => setEdit({ ...edit, items: edit.items.filter((row) => row.key !== item.key) })}>Quitar</button>
              </div>;
            })}
          </div>
          <button className="button button-secondary sale-add-line" type="button" disabled={!products.length} onClick={() => {
            const first = products[0];
            if (first) setEdit({ ...edit, items: [...edit.items, { key: `new-${Date.now()}`, productId: first.id, quantity: 1, prepared: false, unitPrice: first.sale_price, originalProductId: null, originalPrepared: false, productName: optionLabel(first) }] });
          }}>＋ Agregar producto</button>
          {!edit.items.length && <p className="sale-edit-warning">La venta debe conservar al menos un producto.</p>}
          <div className="sale-edit-meta">
            <label>Método de pago<select value={edit.paymentMethod} onChange={(event) => setEdit({ ...edit, paymentMethod: event.target.value })}>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select></label>
            <strong>Nuevo total: {money(editTotal)}</strong>
          </div>
          <label className="sale-reason-label">Motivo de la corrección<textarea required maxLength={300} value={edit.reason} onChange={(event) => setEdit({ ...edit, reason: event.target.value })} placeholder="Ej. se capturó una cantidad incorrecta" /></label>
          {edit.error && <p className="form-error" role="alert">{edit.error}</p>}
          <div className="sale-dialog-actions"><button type="button" className="button button-secondary" disabled={edit.saving} onClick={() => setEdit(null)}>Volver</button><button type="submit" className="button button-primary" disabled={edit.saving || !edit.items.length}>{edit.saving ? 'Guardando…' : 'Guardar corrección'}</button></div>
        </form>
      </div>}

      {cancelSale && <div className="sale-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !cancelSaving) setCancelSale(null); }}>
        <form className="sale-dialog sale-cancel-dialog" role="dialog" aria-modal="true" aria-labelledby="sale-cancel-title" onSubmit={confirmCancel}>
          <button className="sale-dialog-close" type="button" aria-label="Cerrar" disabled={cancelSaving} onClick={() => setCancelSale(null)}>×</button>
          <p className="eyebrow">Cancelar venta</p>
          <h2 id="sale-cancel-title">¿Cancelar {cancelSale.id.slice(0, 8).toUpperCase()}?</h2>
          <p className="sale-dialog-description">La venta permanecerá en el historial como cancelada y se devolverán al almacén las existencias descontadas.</p>
          <label className="sale-reason-label">Motivo de cancelación<textarea required maxLength={300} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Ej. se registró por error" /></label>
          {cancelError && <p className="form-error" role="alert">{cancelError}</p>}
          <div className="sale-dialog-actions"><button type="button" className="button button-secondary" disabled={cancelSaving} onClick={() => setCancelSale(null)}>Volver</button><button type="submit" className="button button-danger" disabled={cancelSaving}>{cancelSaving ? 'Cancelando…' : 'Confirmar cancelación'}</button></div>
        </form>
      </div>}
    </>
  );
}
