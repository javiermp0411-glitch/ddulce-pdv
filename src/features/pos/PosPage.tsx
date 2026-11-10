import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { supabase } from '../../db/supabase';
import { money } from '../../lib/format';
import { PageHeading } from '../../components/ui/PageHeading';

interface PosProduct {
  id: string;
  name: string;
  category: string;
  variant: string;
  unit_label: string;
  sale_price: number;
  stock: number;
  sale_quantity: number;
}

interface CartItem {
  id: string;
  quantity: number;
  customPrice?: number;
}

const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia'] as const;
const productLabel = (product: PosProduct) => `${product.name}${product.variant ? ` · ${product.variant}` : ''}`;

export function PosPage() {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]>('Efectivo');
  const [clothingPrice, setClothingPrice] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);

  const loadProducts = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('inventory_products')
      .select('id,name,category,variant,unit_label,sale_price,stock,sale_quantity')
      .eq('active', true)
      .eq('sale_enabled', true)
      .not('sale_price', 'is', null)
      .order('category').order('name').order('variant');
    if (loadError) {
      setError('No se pudo cargar el catálogo del PDV. Revisa la conexión y tus permisos.');
    } else {
      setProducts((data ?? []) as PosProduct[]);
      setError('');
    }
    setLoading(false);
  }, []);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const categories = useMemo(() => ['Todos', ...new Set(products.map((product) => product.category))], [products]);
  const filteredProducts = products.filter((product) =>
    (category === 'Todos' || product.category === category)
    && productLabel(product).toLowerCase().includes(query.toLowerCase()),
  );
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const findProduct = (id: string) => products.find((product) => product.id === id);
  const total = cart.reduce((sum, item) => {
    const product = findProduct(item.id);
    return sum + (item.customPrice ?? product?.sale_price ?? 0) * item.quantity;
  }, 0);

  const addItem = (id: string) => {
    const product = findProduct(id);
    if (!product) return;
    const itemInCart = cart.find((item) => item.id === id);
    const cartQty = itemInCart?.quantity ?? 0;
    if ((cartQty + 1) * product.sale_quantity > product.stock) {
      setError(`No hay suficientes existencias de ${productLabel(product)}.`);
      return;
    }
    setError('');
    setNotice('');
    setCart((current) => itemInCart
      ? current.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...current, { id, quantity: 1 }]);
  };

  const addClothing = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(clothingPrice);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Captura un precio mayor que cero para la prenda.');
      return;
    }
    setCart((current) => [...current, { id: `ropa-usada-${Date.now()}`, quantity: 1, customPrice: price }]);
    setNotice('');
    setError('');
    setClothingPrice('');
  };

  const changeQuantity = (id: string, amount: number) => {
    setCart((current) => current
      .map((item) => {
        if (item.id !== id) return item;
        const product = findProduct(item.id);
        const nextQuantity = item.quantity + amount;
        if (product && nextQuantity * product.sale_quantity > product.stock) return item;
        return { ...item, quantity: nextQuantity };
      })
      .filter((item) => item.quantity > 0));
  };

  const charge = async () => {
    if (!cart.length || charging) return;
    setCharging(true);
    setError('');
    setNotice('');
    const items = cart.map((item) => {
      const clothing = item.id.startsWith('ropa-usada-');
      return clothing
        ? { product_id: 'ropa-usada', quantity: item.quantity, custom_name: 'Ropa usada', custom_price: item.customPrice }
        : { product_id: item.id, quantity: item.quantity };
    });
    const { error: saleError } = await supabase.rpc('checkout_sale', {
      p_items: items,
      p_payment_method: paymentMethod,
    });
    if (saleError) {
      setError(saleError.message.toLowerCase().includes('existencia')
        ? 'La existencia cambió y ya no alcanza para esa venta. Actualizamos el catálogo; revisa el carrito.'
        : 'No se pudo completar la venta. No se cobró ni se descontó inventario.');
      await loadProducts();
      setCharging(false);
      return;
    }
    setCart([]);
    setNotice(`Venta registrada por ${money(total)}. El inventario se actualizó.`);
    await loadProducts();
    setCharging(false);
  };

  return (
    <>
      <PageHeading eyebrow="Caja" title="Punto de venta" description="El catálogo se actualiza con las existencias del almacén." />
      {error && <p className="inline-feedback form-error" role="alert">{error}</p>}
      {notice && <p className="inline-feedback movement-feedback" role="status">{notice}</p>}

      <div className="pos-layout">
        <section className="panel catalog-panel">
          <div className="catalog-toolbar">
            <label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto..." /></label>
            <div className="category-tabs" role="group" aria-label="Categorías de producto">
              {categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}
            </div>
          </div>

          <div className="catalog-grid">
            {filteredProducts.map((product, index) => {
              const remaining = Math.floor(product.stock / product.sale_quantity);
              return <button className="catalog-card" key={product.id} disabled={remaining === 0} onClick={() => addItem(product.id)}>
                <span className={`catalog-art art-${index % 4}`} aria-hidden="true">{product.category === 'Paletas' ? '🍡' : product.category === 'Bolis' ? '🧊' : product.category === 'Aguas' || product.category === 'Bebidas' ? '🥤' : '🍓'}</span>
                <span className="catalog-name">{productLabel(product)}</span>
                <span className="catalog-detail">{remaining === 0 ? 'Agotado' : `${remaining} ${product.sale_quantity > 1 ? 'promos' : product.unit_label} disponibles`}</span>
                <span className="catalog-price">{money(product.sale_price)} <i>{remaining === 0 ? '—' : '＋'}</i></span>
              </button>;
            })}
            {!loading && filteredProducts.length === 0 && <p className="pos-empty-result">No hay productos disponibles en esta categoría o búsqueda.</p>}
            {loading && <p className="pos-empty-result">Cargando catálogo…</p>}
          </div>

          <form className="clothing-sale-form" onSubmit={addClothing}>
            <div><strong>Ropa usada</strong><small>Sin inventario · captura el precio al vender</small></div>
            <label className="clothing-price-input"><span>$</span><input type="number" min="0.01" step="0.01" required value={clothingPrice} onChange={(event) => setClothingPrice(event.target.value)} placeholder="Precio" /></label>
            <button className="button button-secondary" type="submit">Agregar</button>
          </form>
        </section>

        <aside className="panel cart-panel">
          <div className="cart-heading"><div><h2>Cuenta actual</h2><p>{itemCount} productos</p></div><span className="cart-bag" aria-hidden="true">▣</span></div>
          <div className="cart-items">
            {cart.length ? cart.map((item) => {
              const product = findProduct(item.id);
              const name = product ? productLabel(product) : 'Ropa usada';
              const price = item.customPrice ?? product?.sale_price ?? 0;
              return <div className="cart-item" key={item.id}>
                <div className="cart-item-main"><strong>{name}</strong><span>{money(price)} c/u</span></div>
                <div className="quantity-control"><button aria-label={`Quitar una unidad de ${name}`} onClick={() => changeQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button aria-label={`Agregar una unidad de ${name}`} disabled={Boolean(product && (item.quantity + 1) * product.sale_quantity > product.stock)} onClick={() => changeQuantity(item.id, 1)}>+</button></div>
              </div>;
            }) : <div className="empty-cart"><span>♡</span><strong>Tu cuenta está vacía</strong><p>Elige algo del catálogo para empezar.</p></div>}
          </div>
          <div className="cart-summary">
            <label className="payment-method-label">Método de pago<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as (typeof paymentMethods)[number])}>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select></label>
            <div><span>Subtotal</span><strong>{money(total)}</strong></div><div><span>Descuento</span><strong>{money(0)}</strong></div><div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div>
            <button className="button button-primary charge-button" disabled={!cart.length || charging} onClick={() => void charge()}>{charging ? 'Registrando…' : <>Cobrar <span>·</span> {money(total)}</>}</button>
          </div>
        </aside>
      </div>
    </>
  );
}
