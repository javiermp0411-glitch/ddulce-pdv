# Daylú Dulce — Punto de venta

Aplicación web para apoyar la operación de la paletería Daylú Dulce. El alcance previsto incluye un dashboard con ventas por día, semana y mes; usuarios y permisos; ventas; entradas y salidas de almacén; punto de venta; y gastos.

## Tecnologías

- **Astro** como aplicación web.
- **Supabase** para backend y persistencia de datos.
- **Tailwind CSS** para estilos.
- **React** únicamente en las partes interactivas que lo necesiten.

La interfaz inicial adapta la estructura de navegación del dashboard de plantilla y utiliza una paleta rosa pastel mexicano. Consulta [`design.md`](design.md) para los tokens visuales. Los datos y cambios de las secciones actuales son de demostración y aún no se guardan en Supabase.

## Estado actual

El proyecto está en etapa inicial. Hay pantallas interactivas de demostración para dashboard, ventas, punto de venta, almacén, gastos y usuarios/permisos. La conexión de datos para estas funciones, autenticación, persistencia y permisos reales todavía no están implementados. No instales dependencias ni ejecutes comandos que cambien el entorno sin autorización explícita del propietario.

## Requisitos actuales

- Node.js `>=22.23.4` (según `package.json`).
- Dependencias instaladas: Astro, React con integración Astro, Tailwind CSS y `@supabase/supabase-js`.

## Comandos

```sh
npm run dev
npm run build
npm run preview
```

La ejecución de estos comandos queda sujeta a la autorización del propietario. Para iniciar el servidor de desarrollo en este proyecto, sigue el procedimiento de [`AGENTS.md`](AGENTS.md).

## Estructura de la aplicación

```text
src/
├── layouts/                Documento HTML y estructura compartida de Astro
├── pages/                  Rutas Astro: landing en `/` y aplicación en `/app`
├── components/
│   ├── layout/             Estructura común y navegación
│   └── ui/                 Componentes reutilizables de interfaz
├── features/               Pantallas agrupadas por módulo del PDV
│   ├── dashboard/
│   ├── sales/
│   ├── pos/
│   ├── inventory/
│   ├── expenses/
│   └── users/
├── data/                   Datos de demostración (reemplazables por Supabase)
├── lib/                    Formateadores y utilidades compartidas
├── types/                  Tipos de dominio
└── styles/                 Estilos globales del dashboard
public/                     Archivos estáticos
AGENTS.md                   Guía para agentes y colaboradores
design.md                   Especificación visual
```

Cada módulo tiene su propia pantalla React; `src/components/PosDashboard.tsx` solo conserva el estado de navegación y selecciona la pantalla activa. La landing está en `/` y es Astro estático; el dashboard interactivo está en `/app` y React se carga ahí como isla.

## Datos internos del negocio

El archivo `Daylú Dulce.md` contiene información operativa y comercial privada. Es material de trabajo temporal: no debe publicarse ni incluirse en commits. Está excluido mediante `.gitignore`; elimínalo del espacio de trabajo cuando ya no sea necesario.
