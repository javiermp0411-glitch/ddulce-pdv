# Daylú Dulce — Punto de venta

Aplicación web para apoyar la operación de la paletería Daylú Dulce. El alcance previsto incluye un dashboard con ventas por día, semana y mes; usuarios y permisos; ventas; entradas y salidas de almacén; punto de venta; y gastos.

## Tecnologías previstas

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

## Estructura

```text
src/          Código de la aplicación Astro
public/       Archivos estáticos
AGENTS.md     Guía breve para agentes y colaboradores
design.md     Especificación visual pendiente
```

## Datos internos del negocio

El archivo `Daylú Dulce.md` contiene información operativa y comercial privada. Es material de trabajo temporal: no debe publicarse ni incluirse en commits. Está excluido mediante `.gitignore`; elimínalo del espacio de trabajo cuando ya no sea necesario.
