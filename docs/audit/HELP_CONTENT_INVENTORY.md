# AUDITORÍA DE INVENTARIO Y COMPARACIÓN DE CONTENIDOS (ÉPICA E-005 / PASO 2)

**Fecha de ejecución:** 28 de Noviembre de 2026  
**Proyecto:** Nexo360 — Duoc UC - Sede Alameda  
**Objetivo:** Establecer la línea base comparativa de contenidos entre las fuentes existentes antes de la integración del CMS editorial con el Centro de Ayuda.

---

## 1. Resumen Ejecutivo del Inventario

Se contrastaron exhaustivamente las dos fuentes de datos del repositorio:

| Métrica | Fuente A: `duocModulesData.js` (Frontend) | Fuente B: `institutionalModules.json` (Backend) | Delta / Observación |
|---|:---:|:---:|---|
| **Rol en el sistema** | Fuente activa consumida por estudiantes en `DashboardPage` | Semilla inicial simplificada consumida por `helpContentService` | Discrepancia estructural crítica |
| **Categorías** | 9 | 9 | Mismo número; claves alineadas conceptualmente |
| **Submódulos / Trámites** | 45 | 47 | 15 comunes, 30 con slug enriquecido en A, 32 simplificados en B |
| **Artículos de Ayuda con Guías HTML** | **131** | **0** | **Fuente B carece totalmente de artículos** |
| **Preguntas Frecuentes (FAQs)** | 0 (distribuidas en artículos) | 11 | Fuente B añade sección de FAQs por categoría |
| **Accesos Rápidos (INTENT_SHORTCUTS)** | 9 | 0 | Dependen de los IDs específicos de Fuente A |
| **Artículos Destacados (PROMOTED_ARTICLES)**| 3 | 0 | Dependen de los IDs de Fuente A |
| **Centro de Ayuda Oficial (Metadatos)** | Presente (`DUOC_ONLINE_HELP_CENTER`) | Parcial (`portalUrl`) | URL oficial de Vivo Duoc / Zendesk |

> [!WARNING]
> **Alerta de Pérdida de Datos Potencial:**
> Si el backend hubiese reemplazado ciegamente los contenidos del Centro de Ayuda con la semilla simplificada `institutionalModules.json`, se habrían **destruido 131 artículos oficiales con guías paso a paso**, quebrado los 9 accesos directos por intención (`INTENT_SHORTCUTS`) y roto los 3 artículos destacados (`PROMOTED_ARTICLES`).

---

## 2. Inventario Detallado por Categoría (Fuente A)

| ID Categoría | Nombre Visible | Ícono | Submódulos | Artículos |
|---|---|---|:---:|:---:|
| `admision-matricula` | Admisión y Matrícula | `GraduationCap` | 4 | 14 |
| `orientacion-nuevos` | Orientación y Primeros Pasos | `Compass` | 7 | 21 |
| `vida-academica` | Vida Académica y Normativas | `BookOpen` | 19 | 52 |
| `beneficios-estudiantiles` | Becas y Beneficios Estudiantiles | `HeartHandshake` | 4 | 11 |
| `pagos-deudas` | Pagos, Aranceles y Financiamiento | `CreditCard` | 2 | 6 |
| `servicios-digitales` | Servicios Digitales y TI | `Laptop` | 4 | 12 |
| `titulados` | Titulación y Egresados | `Award` | 3 | 9 |
| `convivencia-inclusion` | Convivencia, Inclusión y Género | `ShieldAlert` | 1 | 3 |
| `sostenedor` | Atención a Sostenedores | `Users` | 1 | 3 |
| **TOTAL** | **9 Categorías** | — | **45 Submódulos** | **131 Artículos** |

---

## 3. Comparación de Identificadores (Submódulos)

### 3.1. Submódulos con Identificador Común (15)
- `admision-regular`
- `licencias-medicas`
- `toma-ramos`
- `inasistencias-justificaciones`
- `reincorporacion-estudios`
- `evaluaciones-recuperativas`
- `suspension-semestre`
- `homologacion-convalidacion`
- `renuncia-carrera`
- `solicitud-reclamacion`
- `becas-estatales`
- `gratuidad`
- `becas-duoc`
- `credito-cae`
- `seguro-accidentes`

### 3.2. Submódulos exclusivos de Fuente A (30 con slug semántico completo)
- `cambio-carrera-jornada-sede`
- `cambio-otra-institucion`
- `reintegros-reincorporaciones`
- `talleres-extracurriculares-inicio`
- `ingreso-primeros-pasos`
- `semana-cero-jornada-inicio`
- `servicios-digitales-nuevos`
- `interrupcion-semestre-nuevos`
- `talleres-extracurriculares-continuidad`
- `certificados-alumnos-notas` *(requerido por INTENT_SHORTCUTS)*
- `revalidacion-reposicion-tne` *(requerido por INTENT_SHORTCUTS)*
- `tav-verano`
- `practicas-profesionales`
- `continuidad-estudios-contrato`
- `cambio-carrera-sede-estudiantes`
- `renuncia-caducidad`
- `apoyo-estudiantes-cuidadores`
- `programas-apoyo-estudiante`
- `paedis-discapacidad` *(requerido por accesos PAEDIS)*
- `bienestar-salud-mental`
- `matricula-arancel-pagos`
- `deudas-repactacion`
- `cuentas-accesos-correo-ava-wifi`
- `seguridad-autenticacion-mfa-clave`
- `plataformas-herramientas-m365-teams-vivo`
- `convenios-software-carrera`
- `diploma-ceremonia-titulos`
- `cuenta-de-titulados`
- `convivencia-denuncias-nombre-social`
- `sostenedor-solicitudes-certificados`

### 3.3. Submódulos exclusivos de Fuente B (32 simplificados)
Submódulos derivados de la estructura inicial no enriquecida (`semana-cero`, `certificados-alumno`, `tav`, `practicas`, `repactacion`, `acceso-ava`, `correo-institucional`, `wifi-duoc`, etc.).

---

## 4. Decisión de Arquitectura para el Contrato Unificado

1. **Unificación sin Pérdidas:** La colección `help_procedures` en MongoDB debe extenderse para aceptar la estructura completa de Fuente A (`articles`, `body`, `summary`, `externalLinks`, `intentGoal`, `intentTags`, `actionLabel`, `zendeskSectionId`).
2. **Reserva de Identificadores:** El script de migración adopta los identificadores de Fuente A como claves canónicas (`procedureId`), preservando intactos los 131 artículos y las rutas de navegación de los estudiantes.
3. **Integración de Preguntas Frecuentes:** Las 11 FAQs de Fuente B se asocian a las categorías correspondientes sin colisionar con los artículos.
4. **Ciclo de Vida Editorial:** Los procedimientos migrados se crean inicialmente en estado `published`, quedando habilitados inmediatamente para edición, borrador, archivo y rollback a través del CMS administrativo.
