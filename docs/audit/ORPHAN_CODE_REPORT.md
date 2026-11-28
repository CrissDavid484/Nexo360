# Nexo360 — Reporte de Código Huérfano y Componentes No Referenciados (Fase 4)

**Fecha:** 27 de Noviembre de 2026  
**Auditoría:** Arquitectura Frontend y Consolidación de Dependencias  
**Entorno:** Nexo360 (Vite / React / Tailwind / Node.js)

---

## 1. Resumen Ejecutivo

Durante la auditoría estática de importaciones del frontend (`frontend/src`), se identificaron cuatro componentes que no cuentan con ningún import ni referencia activa en rutas, páginas o sub-componentes del proyecto.

Estos componentes corresponden a prototipos iniciales que fueron posteriormente reemplazados por componentes unificados y accesibles del sistema de diseño Nexo360.

---

## 2. Inventario de Componentes Huérfanos

| Archivo | Tamaño | Propósito Original | Componente Canónico de Reemplazo | Estado / Recomendación |
| :--- | :--- | :--- | :--- | :--- |
| `frontend/src/components/admin/CatalogEntitiesPanel.jsx` | 15.1 KB (417 lín.) | Panel CRUD primitivo de carreras y sedes. | `AcademicCatalog.jsx` (`components/admin/modules/AcademicCatalog.jsx`) | **Huérfano.** Puede ser eliminado de forma segura; `AcademicCatalog.jsx` absorbió toda su funcionalidad con soporte WCAG 2.2 AAA. |
| `frontend/src/components/admin/ConfirmActionDialog.jsx` | 3.3 KB (92 lín.) | Diálogo modal de confirmación aislado. | `Modal.jsx` (`components/ui/Modal.jsx`) | **Huérfano.** Reemplazado por el componente `Modal` transversal accesible con gestión de foco. |
| `frontend/src/components/admin/MarkdownPreviewModal.jsx` | 5.4 KB (148 lín.) | Modal para previsualizar Markdown de asignaturas. | Integrado directamente en `OfertaAcademica.jsx` y `AcademicCatalog.jsx` con descarga directa. | **Huérfano.** Puede ser archivado o eliminado sin impacto en el bundle. |
| `frontend/src/components/ui/Toggle.jsx` | 2.9 KB (88 lín.) | Switch booleano tipo toggle accesible. | Componentes checkbox nativos estilizados accesibles con soporte WCAG y contraste reforzado. | **Huérfano.** No importado en ninguna vista activa. |

---

## 3. Impacto en el Bundle de Producción (Rollup / Vite)

Gracias a las capacidades de **Tree-Shaking** de Vite y Rollup (ES Modules), estos cuatro archivos no son incluidos en el bundle final generado en `frontend/dist/`. 

Sin embargo, representan:
* **26.7 KB de código fuente inactivo** en el repositorio.
* Posible confusión de mantenimiento para desarrolladores nuevos.
* Costo innecesario en herramientas de análisis estático (SonarQube / ESLint).

---

## 4. Plan de Acción y Disposición

1. **Fase de estabilización actual:** Se documenta su condición de huérfano en este informe y se mantienen temporalmente sin eliminar para preservar historial de referencia si se requiere consultar lógica previa.
2. **Post-lanzamiento / Release 1.1:** Ejecutar eliminación física mediante pull request de limpieza técnica:
   ```bash
   rm frontend/src/components/admin/CatalogEntitiesPanel.jsx
   rm frontend/src/components/admin/ConfirmActionDialog.jsx
   rm frontend/src/components/admin/MarkdownPreviewModal.jsx
   rm frontend/src/components/ui/Toggle.jsx
   ```
