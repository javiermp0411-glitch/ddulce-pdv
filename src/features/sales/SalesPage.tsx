import { DemoNotice } from '../../components/ui/DemoNotice';
import { PageHeading } from '../../components/ui/PageHeading';
import { SalesTable } from '../../components/ui/SalesTable';

export function SalesPage() {
  return (
    <>
      <PageHeading eyebrow="Actividad" title="Ventas" description="Consulta las ventas registradas en caja." />
      <DemoNotice />
      <section className="panel page-panel">
        <div className="panel-heading">
          <div><h2>Historial de ventas</h2><p>Registros de muestra para visualizar la sección.</p></div>
          <button className="button button-secondary" type="button">⇩ <span>Exportar</span></button>
        </div>
        <SalesTable />
      </section>
    </>
  );
}
