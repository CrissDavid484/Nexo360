import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, BarChart2, AlertTriangle, CheckCircle2, Clock, ArrowRight, Brain, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { useAccessibility } from '@context/AccessibilityContext';
import { useAccessibleModal } from '@hooks/useAccessibleModal';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Card } from '@components/ui/Card';

/**
 * Panel lateral deslizable (Slide-over) con Explainability UI del Motor Predictivo.
 * Muestra breakdown ponderado, factores, tendencia semanal y Próxima Acción Recomendada.
 * Accesible: gestión de foco, cierre con Escape, sin tabIndex en no interactivos, compatible Alto Contraste.
 *
 * Consumido por: AdminPanelView.jsx (línea ~XX, import dinámico)
 * Props esperados:
 * - isOpen: boolean
 * - onClose: () => void
 * - prediction: objeto con { riskLevel, score, breakdown, factors, nextBestAction, trend, academicLoad, trafficLight }
 * - student: objeto estudiante (para NBA)
 * - onExecuteAction: (nba, student) => void
 * - isCoordinator: boolean
 * - isAdmin: boolean
 * - getVoiceProps: fn
 * - announce: fn
 */
export const ExplainabilityPanel = ({
  isOpen,
  onClose,
  prediction,
  student,
  onExecuteAction,
  isCoordinator,
  isAdmin,
  getVoiceProps,
  announce,
}) => {
  const panelRef = useRef(null);
  const closeBtnRef = useRef(null);
  const firstFocusableRef = useRef(null);

  useAccessibleModal({
    isOpen,
    onClose,
    containerRef: panelRef,
    initialFocusRef: closeBtnRef,
    restoreFocus: true,
  });

  useEffect(() => {
    if (isOpen) {
      announce('Panel de explicabilidad predictiva abierto. Desglose ponderado, factores y acción recomendada.', 'polite');
    }
  }, [isOpen, announce]);

  if (!isOpen || !prediction) return null;

  const riskLevel = prediction.riskLevel;
  const breakdown = prediction.breakdown || {};
  const factors = prediction.factors || [];
  const nextBestAction = prediction.nextBestAction;
  const trend = prediction.trend;
  const academicLoad = prediction.academicLoad;

  const riskConfig = {
    ALTO: { color: 'error', label: 'Alto Riesgo', icon: AlertTriangle, description: 'Requiere intervención inmediata (Ficha 360 en <48h)' },
    MEDIO: { color: 'warning', label: 'Riesgo Moderado', icon: AlertTriangle, description: 'Seguimiento docente + invitación a Simulador' },
    BAJO: { color: 'success', label: 'Bajo Riesgo', icon: CheckCircle2, description: 'Monitoreo rutinario' },
  }[riskLevel] || { color: 'default', label: riskLevel, icon: AlertTriangle, description: '' };

  const trendConfig = {
    improving: { icon: TrendingUp, label: 'Mejorando', color: 'success', value: trend?.value || 0 },
    declining: { icon: TrendingDown, label: 'Decreciente', color: 'error', value: trend?.value || 0 },
    stable: { icon: CheckCircle2, label: 'Estable', color: 'info', value: trend?.value || 0 },
  }[trend?.direction] || { icon: CheckCircle2, label: 'Estable', color: 'default', value: 0 };

  const factorIcons = {
    attendance: '📊',
    paedis: '♿',
    simulator: '💻',
    trend: '📈',
    load: '📚',
  };

  const panelMarkup = (
    <aside
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="explainability-title"
      className="fixed inset-0 z-50 flex items-center justify-end bg-neutral-900/60 backdrop-blur-sm animate-fade-in"
      onClick={() => onClose()}
    >
      <div
        className="w-full max-w-xl lg:max-w-2xl h-full bg-white rounded-tl-3xl rounded-bl-3xl shadow-2xl border-l border-neutral-200 flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-6 border-b border-neutral-100 sticky top-0 bg-white z-10 rounded-tl-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-navy/10 text-brand-navy">
              <Brain className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="explainability-title" className="text-lg font-bold text-neutral-900">Explainability UI</h2>
              <p className="text-xs text-neutral-500">Desglose del Motor Predictivo de Deserción</p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de explicabilidad"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={firstFocusableRef} tabIndex={-1}>
          <section aria-labelledby="risk-score-heading" className="space-y-3">
            <h3 id="risk-score-heading" className="sr-only">Nivel de Riesgo y Puntuación</h3>
            <Card variant="filled" padding="md" className="relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={'p-3 rounded-2xl bg-semantic-' + riskConfig.color + '-100 text-semantic-' + riskConfig.color + '-700'}>
                    <riskConfig.icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={riskConfig.color} size="lg">{riskConfig.label}</Badge>
                      <span className="text-xs text-neutral-500 font-medium">{riskConfig.description}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Semáforo canónico: <strong className="text-neutral-900">{prediction.trafficLight === 'red' ? '🔴 Rojo' : prediction.trafficLight === 'yellow' ? '🟡 Amarillo' : '🟢 Verde'}</strong></p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-center lg:text-right">
                  <div>
                    <div className="text-4xl font-black text-brand-navy">{prediction.score}</div>
                    <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Score Predictivo (0-100)</div>
                  </div>
                  <div>
                    <div className={'text-2xl font-black text-semantic-' + riskConfig.color + '-600'}>{prediction.graduationProbability}%</div>
                    <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Prob. Titulación</div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section aria-labelledby="breakdown-heading" className="space-y-3">
            <h3 id="breakdown-heading" className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-brand-navy" aria-hidden="true" />
              Desglose Ponderado
            </h3>
            <Card variant="filled" padding="md">
              <div className="space-y-3">
                {Object.entries(breakdown).map(([key, data]) => {
                  const weightPct = Math.round((data.weight || 0) * 100);
                  const contributionPct = Math.round(((data.contribution || 0) / (prediction.score || 1)) * 100);
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-500">{factorIcons[key] || '•'}</span>
                          <span className="font-semibold text-neutral-900 capitalize">{key}</span>
                          <Badge variant="default" size="sm">{weightPct}% peso</Badge>
                        </div>
                        <span className="font-bold text-brand-navy">{data.rawScore || 0}/100</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={'h-full rounded-full transition-all duration-500 bg-semantic-' + riskConfig.color + '-500'}
                          style={{ width: Math.min(100, Math.max(0, contributionPct)) + '%' }}
                          role="progressbar"
                          aria-valuenow={contributionPct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={key + ': ' + contributionPct + '% de contribución al score final'}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-neutral-500">
                        <span>Score bruto: {data.rawScore || 0}</span>
                        <span>Contribución: {data.contribution || 0} pts ({contributionPct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </section>

          {factors.length > 0 && (
            <section aria-labelledby="factors-heading" className="space-y-3">
              <h3 id="factors-heading" className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
                Factores Explicativos
              </h3>
              <Card variant="outlined" padding="md">
                <ul className="space-y-2" role="list">
                  {factors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-neutral-700 leading-relaxed">
                      <span className="text-neutral-400 font-bold mt-0.5">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          <section aria-labelledby="trend-load-heading" className="space-y-3">
            <h3 id="trend-load-heading" className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-navy" aria-hidden="true" />
              Tendencia & Carga Académica
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card variant="filled" padding="md">
                <div className="flex items-center gap-2 mb-2">
                  <div className={'p-2 rounded-xl bg-semantic-' + trendConfig.color + '-100 text-semantic-' + trendConfig.color + '-700'}>
                    <trendConfig.icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="font-semibold text-neutral-900">Tendencia 4 sem. vs 4 ant.</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={'text-3xl font-black text-semantic-' + trendConfig.color + '-600'}>
                    {trendConfig.value > 0 ? '+' : ''}{trendConfig.value}%
                  </span>
                  <span className="text-xs font-semibold text-neutral-500 capitalize">{trendConfig.label}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  {trendConfig.value > 0
                    ? 'Asistencia mejorando vs período anterior'
                    : trendConfig.value < 0
                    ? 'Asistencia decreciente — requiere atención'
                    : 'Tendencia estable'}
                </p>
              </Card>

              <Card variant="filled" padding="md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-brand-navy/10 text-brand-navy">
                    <Target className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="font-semibold text-neutral-900">Carga Académica</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Créditos totales</span>
                    <span className="font-bold text-neutral-900">{academicLoad?.totalCredits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Asignaturas</span>
                    <span className="font-bold text-neutral-900">{academicLoad?.courseCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Con prácticas/labs</span>
                    <span className="font-bold text-neutral-900">{academicLoad?.hasPractices ? 'Sí' : 'No'}</span>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {nextBestAction && (
            <section aria-labelledby="nba-heading" className="space-y-3">
              <h3 id="nba-heading" className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-gold" aria-hidden="true" />
                Próxima Acción Recomendada
              </h3>
              <Card variant="elevated" padding="md" className="border-brand-gold/30 bg-amber-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-brand-gold/20 to-transparent rounded-full -translate-x-1/2 translate-y-1/2" aria-hidden="true" />
                <div className="relative space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="amber" size="sm">Prioridad #{nextBestAction.priority}</Badge>
                    <Badge variant="default" size="sm">SLA {nextBestAction.slaHours}h</Badge>
                  </div>
                  <p className="text-sm font-medium text-neutral-900 leading-relaxed">{nextBestAction.action}</p>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 pt-2 border-t border-neutral-200">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Regla: <code className="text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-[10px]">{nextBestAction.triggeredRule}</code></span>
                  </div>

                  {(isCoordinator || isAdmin) && (
                    <div className="pt-2">
                      <Button
                        variant="amber"
                        size="lg"
                        fullWidth
                        leftIcon={<ArrowRight className="w-4 h-4" />}
                        voiceLabel={'Ejecutar acción recomendada: ' + nextBestAction.action}
                        onClick={() => {
                          onExecuteAction(nextBestAction, student);
                          onClose();
                        }}
                      >
                        Ejecutar Acción Recomendada
                      </Button>
                    </div>
                  )}
                  {!isCoordinator && !isAdmin && (
                    <p className="pt-2 text-xs text-neutral-500 text-center">
                      Solo Coordinador PAEDIS / Administrador pueden ejecutar la acción.
                    </p>
                  )}
                </div>
              </Card>
            </section>
          )}

          <section aria-labelledby="privacy-heading" className="space-y-2">
            <Card variant="filled" padding="md" className="bg-purple-50/50 border-purple-200">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <div>
                  <h4 className="text-xs font-bold text-purple-900">Ley N° 21.719 — Privacidad Clínica</h4>
                  <p className="text-xs text-purple-800 mt-0.5">
                    {isCoordinator
                      ? 'Rol Coordinador PAEDIS: Acceso completo a factores (incluye diagnóstico PAEDIS si corresponde).'
                      : 'Rol Administrador TI: Diagnósticos clínicos y datos sensibles de discapacidad OCULTOS por ley. Solo se muestran factores operativos (asistencia, simulador, carga).'}
                  </p>
                </div>
              </div>
            </Card>
          </section>
        </div>

        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 rounded-bl-3xl">
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
            <span className="w-8 h-0.5 bg-neutral-300 rounded-full" aria-hidden="true" />
            <span>Arrastra o presiona Escape para cerrar</span>
            <span className="w-8 h-0.5 bg-neutral-300 rounded-full" aria-hidden="true" />
          </div>
        </div>
      </div>
    </aside>
  );

  // Portal en document.body para preservar position: fixed bajo #nexo-cb-canvas
  return typeof document !== 'undefined' ? createPortal(panelMarkup, document.body) : panelMarkup;
};

export default ExplainabilityPanel;