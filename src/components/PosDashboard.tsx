import { useMemo, useState, type FormEvent, type ReactNode } from 'react';

type Section = 'dashboard' | 'sales' | 'pos' | 'inventory' | 'expenses' | 'users';
type Period = 'Hoy' | 'Esta semana' | 'Este mes';

const navigation: { id: Section; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'sales', label: 'Ventas', icon: '↗' },
  { id: 'pos', label: 'Punto de venta', icon: '$' },
  { id: 'inventory', label: 'Almacén', icon: '▤' },
  { id: 'expenses', label: 'Gastos', icon: '↘' },
  { id: 'users', label: 'Usuarios y permisos', icon: '♙' },
];

const products = [
  { id: 'paleta-preparada', name: 'Paleta preparada', category: 'Paletas', price: 20, stock: 18, detail: 'Chamoy y gomitas' },
  { id: 'paleta-agua', name: 'Paleta de agua', category: 'Paletas', price: 15, stock: 24, detail: 'Sabores surtidos' },
  { id: 'paleta-helado', name: 'Paleta de helado', category: 'Paletas', price: 25, stock: 12, detail: 'Cobertura de avellana' },
  { id: 'boli-agua', name: 'Boli de agua', category: 'Bolis', price: 10, stock: 30, detail: 'Piña, uva, limón o fresa' },
  { id: 'boli-leche', name: 'Boli de leche', category: 'Bolis', price: 10, stock: 12, detail: 'Rompope' },
  { id: 'agua-fresca', name: 'Agua fresca · 1 L', category: 'Aguas', price: 20, stock: 10, detail: 'Jamaica o limón' },
  { id: 'mini-barrita', name: 'Mini barrita', category: 'Botanas', price: 4, stock: 20, detail: 'Fresa o piña' },
  { id: 'bolsa-hielo', name: 'Bolsa de hielo · 1 L', category: 'Botanas', price: 6, stock: 15, detail: 'Agua congelada' },
];

const sampleSales = [
  { id: 'V-1042', time: '12:42 p. m.', items: '2 × Paleta preparada', method: 'Efectivo', total: 40 },
  { id: 'V-1041', time: '12:18 p. m.', items: 'Agua fresca · 1 L', method: 'Efectivo', total: 20 },
  { id: 'V-1040', time: '11:56 a. m.', items: '3 × Boli de agua', method: 'Efectivo', total: 30 },
  { id: 'V-1039', time: '11:21 a. m.', items: 'Paleta de helado', method: 'Efectivo', total: 25 },
];

const money = (amount: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subheading">{description}</p></div>{children}</div>;
}

function DemoNotice() {
  return <p className="demo-notice"><span aria-hidden="true">✿</span> Vista de demostración · Los datos y cambios aún no se guardan en Supabase.</p>;
}

function DashboardPage({ onNavigate }: { onNavigate: (section: Section) => void }) {
  const [period, setPeriod] = useState<Period>('Hoy');
  const totals: Record<Period, { sales: string; count: string; average: string; expenses: string; bars: number[] }> = {
    Hoy: { sales: '$685', count: '32', average: '$21.41', expenses: '$80', bars: [24, 32, 42, 28, 56, 42, 70, 52, 88, 62, 96, 74] },
    'Esta semana': { sales: '$3,420', count: '164', average: '$20.85', expenses: '$420', bars: [32, 50, 44, 72, 56, 86, 64, 46, 72, 92, 78, 100] },
    'Este mes': { sales: '$12,850', count: '612', average: '$21.00', expenses: '$1,240', bars: [42, 30, 65, 48, 72, 58, 82, 54, 76, 91, 68, 100] },
  };
  const total = totals[period];
  return <>
    <PageHeading eyebrow="Resumen del negocio" title="¡Hola, Daylú!" description="Así va tu paletería. Aquí tienes el resumen de actividad.">
      <div className="period-switch" role="group" aria-label="Periodo del resumen">{(['Hoy', 'Esta semana', 'Este mes'] as Period[]).map((item) => <button key={item} className={period === item ? 'selected' : ''} onClick={() => setPeriod(item)}>{item}</button>)}</div>
    </PageHeading>
    <div className="stat-grid">
      <StatCard label={`Ventas · ${period.toLowerCase()}`} value={total.sales} change="↗ 12%" hint="vs. periodo anterior" icon="₊" tone="rose" />
      <StatCard label="Transacciones" value={total.count} change="↗ 8%" hint="ventas registradas" icon="▣" tone="lime" />
      <StatCard label="Venta promedio" value={total.average} change="↗ 3%" hint="por compra" icon="◉" tone="peach" />
      <StatCard label="Gastos registrados" value={total.expenses} change="Este periodo" hint="salidas de dinero" icon="↘" tone="cream" />
    </div>
    <div className="content-grid dashboard-grid">
      <section className="panel sales-chart-panel">
        <div className="panel-heading"><div><h2>Ventas</h2><p>Actividad durante {period.toLowerCase()}</p></div><span className="chart-total">{total.sales}</span></div>
        <div className="chart" aria-label={`Gráfica ilustrativa de ventas para ${period}`} role="img"><div className="chart-guides"><i>$600</i><i>$400</i><i>$200</i><i>$0</i></div><div className="chart-bars">{total.bars.map((height, index) => <div className="chart-column" key={index}><span className={index === 8 ? 'chart-bar highlight' : 'chart-bar'} style={{ height: `${height}%` }} /><small>{index % 3 === 0 ? `${9 + index}h` : ''}</small></div>)}</div></div>
        <p className="chart-footnote">Gráfica ilustrativa · integraremos los datos reales después.</p>
      </section>
      <section className="panel top-products-panel">
        <div className="panel-heading"><div><h2>Lo más vendido</h2><p>Productos destacados</p></div><span className="round-icon">✳</span></div>
        {[['Paleta preparada', '18 piezas', '🍓'], ['Boli de fresa', '14 piezas', '🍧'], ['Agua de jamaica', '9 piezas', '🥤'], ['Paleta de mango', '7 piezas', '🥭']].map(([name, amount, emoji], index) => <div className="product-rank" key={name}><span className="rank-number">0{index + 1}</span><span className="product-emoji">{emoji}</span><span className="rank-name">{name}<small>{amount}</small></span><span className="rank-track"><i style={{ width: `${100 - index * 18}%` }} /></span></div>)}
      </section>
    </div>
    <section className="panel recent-panel"><div className="panel-heading"><div><h2>Ventas recientes</h2><p>Movimientos registrados en caja</p></div><button className="text-button" onClick={() => onNavigate('sales')}>Ver todas <span>→</span></button></div><SalesTable compact /></section>
  </>;
}

function StatCard({ label, value, change, hint, icon, tone }: { label: string; value: string; change: string; hint: string; icon: string; tone: string }) {
  return <article className="stat-card"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`} aria-hidden="true">{icon}</span></div><strong>{value}</strong><div className="stat-bottom"><span className="stat-change">{change}</span><span>{hint}</span></div></article>;
}

function SalesTable({ compact = false }: { compact?: boolean }) {
  return <div className="table-scroll"><table><thead><tr><th>Folio</th><th>Hora</th><th>Productos</th><th>Pago</th><th className="align-right">Total</th></tr></thead><tbody>{sampleSales.slice(0, compact ? 3 : undefined).map((sale) => <tr key={sale.id}><td><span className="folio">{sale.id}</span></td><td>{sale.time}</td><td>{sale.items}</td><td><span className="status-pill">{sale.method}</span></td><td className="align-right amount">{money(sale.total)}</td></tr>)}</tbody></table></div>;
}

function SalesPage() {
  return <><PageHeading eyebrow="Actividad" title="Ventas" description="Consulta las ventas registradas en caja." /><DemoNotice /><section className="panel page-panel"><div className="panel-heading"><div><h2>Historial de ventas</h2><p>Registros de muestra para visualizar la sección.</p></div><button className="button button-secondary" type="button">⇩ <span>Exportar</span></button></div><SalesTable /></section></>;
}

type CartItem = { id: string; quantity: number };
function PosPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState('');
  const categories = ['Todos', 'Paletas', 'Bolis', 'Aguas', 'Botanas'];
  const filtered = products.filter((product) => (category === 'Todos' || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase()));
  const total = cart.reduce((sum, item) => sum + (products.find((product) => product.id === item.id)?.price ?? 0) * item.quantity, 0);
  const addItem = (id: string) => { setNotice(''); setCart((current) => current.some((item) => item.id === id) ? current.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { id, quantity: 1 }]); };
  const changeQuantity = (id: string, amount: number) => setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  const charge = () => { if (!cart.length) return; setNotice(`Venta de demostración por ${money(total)}. No se guardó en la base de datos.`); setCart([]); };
  return <><PageHeading eyebrow="Caja" title="Punto de venta" description="Agrega productos al carrito y calcula el total." /><DemoNotice />
    <div className="pos-layout"><section className="panel catalog-panel"><div className="catalog-toolbar"><label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto..." /></label><div className="category-tabs" role="group" aria-label="Categorías de producto">{categories.map((item) => <button key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div></div><div className="catalog-grid">{filtered.map((product, index) => <button className="catalog-card" key={product.id} onClick={() => addItem(product.id)}><span className={`catalog-art art-${index % 4}`} aria-hidden="true">{product.category === 'Paletas' ? '🍡' : product.category === 'Bolis' ? '🧊' : product.category === 'Aguas' ? '🥤' : '🍓'}</span><span className="catalog-name">{product.name}</span><span className="catalog-detail">{product.detail}</span><span className="catalog-price">{money(product.price)} <i>＋</i></span></button>)}</div></section>
      <aside className="panel cart-panel"><div className="cart-heading"><div><h2>Cuenta actual</h2><p>{cart.reduce((sum, item) => sum + item.quantity, 0)} productos</p></div><span className="cart-bag">▣</span></div><div className="cart-items">{cart.length ? cart.map((item) => { const product = products.find((entry) => entry.id === item.id)!; return <div className="cart-item" key={item.id}><div className="cart-item-main"><strong>{product.name}</strong><span>{money(product.price)} c/u</span></div><div className="quantity-control"><button aria-label={`Quitar una unidad de ${product.name}`} onClick={() => changeQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button aria-label={`Agregar una unidad de ${product.name}`} onClick={() => changeQuantity(item.id, 1)}>+</button></div></div>; }) : <div className="empty-cart"><span>♡</span><strong>Tu cuenta está vacía</strong><p>Elige algo rico del menú para empezar.</p></div>}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{money(total)}</strong></div><div><span>Descuento</span><strong>{money(0)}</strong></div><div className="cart-total"><span>Total</span><strong>{money(total)}</strong></div><button className="button button-primary charge-button" disabled={!cart.length} onClick={charge}>Cobrar <span>·</span> {money(total)}</button>{notice && <p className="inline-feedback" role="status">{notice}</p>}</div></aside>
    </div></>;
}

function InventoryPage() {
  const [stock, setStock] = useState(() => products.map(({ id, name, category, stock: quantity }) => ({ id, name, category, quantity })));
  const [movement, setMovement] = useState('');
  const adjust = (id: string, amount: number) => { setStock((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(0, item.quantity + amount) } : item)); setMovement(amount > 0 ? 'Entrada de demostración aplicada.' : 'Salida de demostración aplicada.'); };
  return <><PageHeading eyebrow="Existencias" title="Almacén" description="Revisa existencias y registra movimientos de entrada o salida." /><DemoNotice />{movement && <p className="inline-feedback movement-feedback" role="status">{movement} El cambio solo vive en esta sesión.</p>}<section className="panel page-panel"><div className="panel-heading"><div><h2>Inventario de productos</h2><p>Existencias de muestra · usa los botones para probar movimientos.</p></div><span className="inventory-count">{stock.length} productos</span></div><div className="table-scroll"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Existencia</th><th>Estado</th><th className="align-right">Movimiento demo</th></tr></thead><tbody>{stock.map((item) => <tr key={item.id}><td className="product-cell">{item.name}</td><td>{item.category}</td><td><strong>{item.quantity}</strong> pzas.</td><td><span className={item.quantity <= 12 ? 'stock-pill low' : 'stock-pill'}>{item.quantity <= 12 ? 'Resurtir pronto' : 'Disponible'}</span></td><td className="align-right movement-actions"><button aria-label={`Registrar entrada de ${item.name}`} onClick={() => adjust(item.id, 1)}>＋</button><button aria-label={`Registrar salida de ${item.name}`} disabled={item.quantity === 0} onClick={() => adjust(item.id, -1)}>−</button></td></tr>)}</tbody></table></div></section></>;
}

function ExpensesPage() {
  const [expenses, setExpenses] = useState([{ name: 'Internet', date: 'Hoy', category: 'Servicio', amount: 125 }, { name: 'Compra de insumos', date: 'Ayer', category: 'Insumos', amount: 280 }, { name: 'Luz', date: '1 nov 2026', category: 'Servicio', amount: 500 }]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const addExpense = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const value = Number(amount); if (!name.trim() || value <= 0) return; setExpenses((current) => [{ name: name.trim(), date: 'Hoy', category: 'Otro', amount: value }, ...current]); setName(''); setAmount(''); };
  return <><PageHeading eyebrow="Control financiero" title="Gastos" description="Lleva un registro de las salidas de dinero del negocio." /><DemoNotice /><div className="expense-summary"><span className="expense-summary-icon">↘</span><div><small>Total de gastos de muestra</small><strong>{money(expenses.reduce((sum, item) => sum + item.amount, 0))}</strong></div><span className="expense-summary-period">Registros de ejemplo</span></div><div className="content-grid expense-grid"><section className="panel page-panel"><div className="panel-heading"><div><h2>Gastos recientes</h2><p>Detalle de salidas registradas</p></div></div><div className="table-scroll"><table><thead><tr><th>Concepto</th><th>Fecha</th><th>Categoría</th><th className="align-right">Importe</th></tr></thead><tbody>{expenses.map((item, index) => <tr key={`${item.name}-${index}`}><td className="product-cell">{item.name}</td><td>{item.date}</td><td>{item.category}</td><td className="align-right amount">{money(item.amount)}</td></tr>)}</tbody></table></div></section><section className="panel add-expense-panel"><div className="panel-heading"><div><h2>Agregar gasto</h2><p>Prueba el formulario en esta vista.</p></div></div><form onSubmit={addExpense} className="expense-form"><label>Concepto<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Compra de fruta" required /></label><label>Importe en MXN<input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" step="0.01" placeholder="0.00" required /></label><button className="button button-primary" type="submit">＋ Registrar gasto demo</button></form></section></div></>;
}

function UsersPage() {
  const users = [{ name: 'Javier Montero', role: 'Propietario', email: 'Administrador del negocio', status: 'Activo', initials: 'JM' }, { name: 'Guadalupe Conde', role: 'Propietaria', email: 'Administradora del negocio', status: 'Activo', initials: 'GC' }, { name: 'Personal de caja', role: 'Cajero/a', email: 'Cuenta por configurar', status: 'Pendiente', initials: 'PC' }];
  return <><PageHeading eyebrow="Acceso al sistema" title="Usuarios y permisos" description="Define quién puede consultar y operar cada sección." /><DemoNotice /><section className="panel page-panel"><div className="panel-heading"><div><h2>Equipo</h2><p>Usuarios ilustrativos; el inicio de sesión y los permisos aún no están conectados.</p></div><button className="button button-primary" type="button" onClick={() => window.alert('La gestión de cuentas se habilitará al implementar autenticación.')}>＋ Invitar usuario</button></div><div className="users-list">{users.map((user) => <article className="user-row" key={user.name}><span className="user-avatar">{user.initials}</span><div className="user-details"><strong>{user.name}</strong><span>{user.email}</span></div><span className="role-badge">{user.role}</span><span className={user.status === 'Activo' ? 'status-pill' : 'stock-pill'}>{user.status}</span><button className="more-button" aria-label={`Más opciones para ${user.name}`}>···</button></article>)}</div><div className="permissions-note"><span>✳</span><div><strong>Permisos por rol</strong><p>La matriz de permisos se definirá junto con el flujo de usuarios. Por ahora no hay accesos reales configurados.</p></div></div></section></>;
}

export default function PosDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);
  const current = useMemo(() => navigation.find((item) => item.id === activeSection)!, [activeSection]);
  const changeSection = (section: Section) => { setActiveSection(section); setMobileMenu(false); };
  const renderSection = () => {
    switch (activeSection) {
      case 'sales': return <SalesPage />;
      case 'pos': return <PosPage />;
      case 'inventory': return <InventoryPage />;
      case 'expenses': return <ExpensesPage />;
      case 'users': return <UsersPage />;
      default: return <DashboardPage onNavigate={changeSection} />;
    }
  };
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="brand-lockup"><span className="brand-mark"><i>✿</i></span><span><strong>Daylú Dulce</strong><small>Paletería & antojos</small></span></div>
      <div className="nav-caption">MENÚ PRINCIPAL</div><nav aria-label="Navegación principal"><ul>{navigation.map((item) => <li key={item.id}><button className={`nav-item ${activeSection === item.id ? 'active' : ''}`} onClick={() => changeSection(item.id)} aria-current={activeSection === item.id ? 'page' : undefined}><span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}{item.id === 'pos' && <span className="nav-new">CAJA</span>}</button></li>)}</ul></nav>
      <div className="sidebar-bottom"><div className="open-status"><span className="open-dot" /><span><strong>Negocio abierto</strong><small>Horario de hoy · hasta 5:00 p. m.</small></span></div><div className="sidebar-user"><span className="user-avatar owner-avatar">DD</span><span><strong>Daylú Dulce</strong><small>Propietarios</small></span><span className="more-button" aria-hidden="true">···</span></div></div>
    </aside>
    {mobileMenu && <button className="mobile-backdrop" aria-label="Cerrar menú" onClick={() => setMobileMenu(false)} />}
    <main className="main-area"><header className="topbar"><button className="menu-toggle" aria-label="Abrir menú" onClick={() => setMobileMenu(true)}>☰</button><div className="breadcrumb"><span>Daylú Dulce</span><i>/</i><strong>{current.label}</strong></div><div className="topbar-actions"><span className="today-label">Jueves, 5 de noviembre</span><span className="topbar-divider" /><button className="topbar-avatar" aria-label="Perfil de Daylú Dulce">DD</button></div></header><div className="page-content">{renderSection()}<footer className="page-footer"><span>Daylú Dulce <i>·</i> Punto de venta</span><span>Hecho con cariño en Villahermosa, Tabasco ♡</span></footer></div></main>
  </div>;
}
