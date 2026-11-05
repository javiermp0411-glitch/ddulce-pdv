import { useState, type FormEvent } from 'react';
import { sampleExpenses } from '../../data/demo';
import { money } from '../../lib/format';
import { DemoNotice } from '../../components/ui/DemoNotice';
import { PageHeading } from '../../components/ui/PageHeading';

export function ExpensesPage() {
  const [expenses, setExpenses] = useState(sampleExpenses);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  const addExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (!name.trim() || value <= 0) return;

    setExpenses((current) => [
      { name: name.trim(), date: 'Hoy', category: 'Otro', amount: value },
      ...current,
    ]);
    setName('');
    setAmount('');
  };

  return (
    <>
      <PageHeading eyebrow="Control financiero" title="Gastos" description="Lleva un registro de las salidas de dinero del negocio." />
      <DemoNotice />
      <div className="expense-summary">
        <span className="expense-summary-icon">↘</span>
        <div><small>Total de gastos de muestra</small><strong>{money(total)}</strong></div>
        <span className="expense-summary-period">Registros de ejemplo</span>
      </div>

      <div className="content-grid expense-grid">
        <section className="panel page-panel">
          <div className="panel-heading"><div><h2>Gastos recientes</h2><p>Detalle de salidas registradas</p></div></div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Concepto</th><th>Fecha</th><th>Categoría</th><th className="align-right">Importe</th></tr></thead>
              <tbody>
                {expenses.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td className="product-cell">{item.name}</td><td>{item.date}</td><td>{item.category}</td>
                    <td className="align-right amount">{money(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel add-expense-panel">
          <div className="panel-heading"><div><h2>Agregar gasto</h2><p>Prueba el formulario en esta vista.</p></div></div>
          <form onSubmit={addExpense} className="expense-form">
            <label>Concepto<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Compra de fruta" required /></label>
            <label>Importe en MXN<input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" step="0.01" placeholder="0.00" required /></label>
            <button className="button button-primary" type="submit">＋ Registrar gasto demo</button>
          </form>
        </section>
      </div>
    </>
  );
}
