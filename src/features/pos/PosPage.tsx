import { useState } from 'react';
import { products } from '../../data/demo';
import { money } from '../../lib/format';
import { DemoNotice } from '../../components/ui/DemoNotice';
import { PageHeading } from '../../components/ui/PageHeading';

interface CartItem {
  id: string;
  quantity: number;
}

const categories = ['Todos', 'Paletas', 'Bolis', 'Aguas', 'Botanas'];

export function PosPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState('');

  const filteredProducts = products.filter((product) =>
    (category === 'Todos' || product.category === category)
    && product.name.toLowerCase().includes(query.toLowerCase()),
  );
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const total = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  const addItem = (id: string) => {
    setNotice('');
    setCart((current) => current.some((item) => item.id === id)
      ? current.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...current, { id, quantity: 1 }]);
  };

  const changeQuantity = (id: string, amount: number) => {
    setCart((current) => current
      .map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item)
      .filter((item) => item.quantity > 0));
  };

  const charge = () => {
    if (!cart.length) return;
    setNotice(`Venta de demostración por ${money(total)}. No se guardó en la base de datos.`);
    setCart([]);
  };

  return (
    <>
      <PageHeading eyebrow="Caja" title="Punto de venta" description="Agrega productos al carrito y calcula el total." />
      <DemoNotice />

      <div className="pos-layout">
        <section className="panel catalog-panel">
          <div className="catalog-toolbar">
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto..." />
            </label>
            <div className="category-tabs" role="group" aria-label="Categorías de producto">
              {categories.map((item) => (
                <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>
              ))}
            </div>
          </div>

          <div className="catalog-grid">
            {filteredProducts.map((product, index) => (
              <button className="catalog-card" key={product.id} onClick={() => addItem(product.id)}>
                <span className={`catalog-art art-${index % 4}`} aria-hidden="true">
                  {product.category === 'Paletas' ? '🍡' : product.category === 'Bolis' ? '🧊' : product.category === 'Aguas' ? '🥤' : '🍓'}
                </span>
                <span className="catalog-name">{product.name}</span>
                <span className="catalog-detail">{product.detail}</span>
                <span className="catalog-price">{money(product.price)} <i>＋</i></span>
              </button>
            ))}
          </div>
        </section>

        <aside className="panel cart-panel">
          <div className="cart-heading">
            <div><h2>Cuenta actual</h2><p>{itemCount} productos</p></div>
            <span className="cart-bag" aria-hidden="true">▣</span>
          </div>

          <div className="cart-items">
            {cart.length ? cart.map((item) => {
              const product = products.find((entry) => entry.id === item.id)!;
              return (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-main"><strong>{product.name}</strong><span>{money(product.price)} c/u</span></div>
                  <div className="quantity-control">
                    <button aria-label={`Quitar una unidad de ${product.name}`} onClick={() => changeQuantity(item.id, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button aria-label={`Agregar una unidad de ${product.name}`} onClick={() => changeQuantity(item.id, 1)}>+</button>
                  </div>
                </div>
              );
            }) : (
              <div className="empty-cart"><span>♡</span><strong>Tu cuenta está vacía</strong><p>Elige algo rico del menú para empezar.</p></div>
            )}
          </div>

          <div className="cart-summary">
            <div><span>Subtotal</span><strong>{money(total)}</strong></div>
            <div><span>Descuento</span><strong>{money(0)}</strong></div>
            <div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div>
            <button className="button button-primary charge-button" disabled={!cart.length} onClick={charge}>Cobrar <span>·</span> {money(total)}</button>
            {notice && <p className="inline-feedback" role="status">{notice}</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
