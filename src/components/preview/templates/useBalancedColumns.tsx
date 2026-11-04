'use client';

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Lado de la maqueta de dos columnas. */
export type ColumnKey = 'left' | 'right';

export interface BalanceSection {
  /** Identificador estable de la sección. */
  id: string;
  /** Contenido ya renderizado de la sección. */
  node: ReactNode;
  /** Columnas donde la sección se lee bien. Una sola entrada = sección fija. */
  columns: ColumnKey[];
  /** Columna natural; el balanceo solo se aparta de ella si compensa. */
  prefer: ColumnKey;
}

export interface BalancedColumns {
  /** Nodos de la columna izquierda, en orden de lectura. */
  left: ReactNode[];
  /** Nodos de la columna derecha, en orden de lectura. */
  right: ReactNode[];
  /** Ref de la columna izquierda: mide el ancho real para los cálculos. */
  leftRef: (node: HTMLElement | null) => void;
  /** Ref de la columna derecha. */
  rightRef: (node: HTMLElement | null) => void;
  /** Capa oculta de medición. Se renderiza al final de la maqueta. */
  probe: ReactNode;
}

type Assignment = Record<ColumnKey, string[]>;
type Sizes = Record<string, Partial<Record<ColumnKey, number>>>;

/** Reparto inicial: cada sección en su columna natural, en orden canónico. */
function initialAssignment(sections: BalanceSection[]): Assignment {
  const assignment: Assignment = { left: [], right: [] };
  for (const section of sections) {
    assignment[section.prefer].push(section.id);
  }
  return assignment;
}

/** Suma de las alturas de las secciones asignadas a una columna. */
function columnFill(assignment: Assignment, sizes: Sizes, key: ColumnKey): number {
  return assignment[key].reduce((sum, id) => sum + (sizes[id]?.[key] ?? 0), 0);
}

/**
 * Elige el reparto que menos altura de hoja consume.
 *
 * Se prueban TODOS los repartos posibles de las secciones flexibles en vez de
 * moverlas de una en una. El método voraz (mover la que más mejora ahora) se
 * queda en un óptimo local: en candy-editorial sacaba 1490px de altura, pero
 * con el criterio de columna más alta se quedaba en 1693px porque la primera
 * jugada llevaba a un final peor. Aquí no hay ese problema porque se evalúa el
 * resultado completo de cada reparto.
 *
 * El alto de la columna más alta pesa 1000x porque es lo que decide cuántas
 * páginas ocupa la hoja; el desequilibrio solo desempata. Un reparto que
 * desborda la capacidad se penaliza aparte.
 */
function planAssignment(
  sections: BalanceSection[],
  sizes: Sizes,
  capacity: number,
): Assignment {
  const flexible = sections.filter((section) => section.columns.length > 1);
  let best: { assignment: Assignment; score: number } | null = null;

  for (let mask = 0; mask < 1 << flexible.length; mask += 1) {
    const assignment: Assignment = { left: [], right: [] };
    for (const section of sections) {
      const slot = flexible.indexOf(section);
      const column = slot === -1
        ? section.prefer
        : (mask >> slot) & 1 ? 'left' : 'right';
      assignment[column].push(section.id);
    }
    const leftFill = columnFill(assignment, sizes, 'left');
    const rightFill = columnFill(assignment, sizes, 'right');
    const alto = Math.max(leftFill, rightFill);
    // Un reparto que no cabe en la hoja hace crecer la maqueta: se penaliza
    // aparte para que cualquier opción que quepa gane.
    const desborde = alto > capacity ? alto - capacity : 0;
    const score = alto * 1000 + Math.abs(leftFill - rightFill) + desborde * 2000;
    if (!best || score < best.score) best = { assignment, score };
  }

  return best ? best.assignment : { left: sections.filter((s) => s.prefer === 'left').map((s) => s.id), right: sections.filter((s) => s.prefer === 'right').map((s) => s.id) };
}

/**
 * Equilibra las dos columnas de una maqueta moviendo secciones enteras.
 *
 * El problema que resuelve: con el reparto fijo, la barra lateral recibe
 * contacto, idiomas y habilidades (poco contenido) mientras la principal
 * recibe resumen, experiencia y formación (mucho). La izquierda se queda a
 * media hoja y la derecha se desborda a la página siguiente.
 *
 * Se mide el alto real de cada sección en el ancho de cada columna y se
 * traslada, de una en una, la que más acerque las dos columnas. El orden de
 * lectura dentro de cada columna nunca cambia, y una sección que no se lea
 * bien en una columna (por ejemplo, la experiencia dentro de una barra de
 * 200px) declara en cuáles puede vivir y queda fija allí.
 *
 * @param sections Secciones en orden canónico de lectura.
 * @param rootRef Elemento raíz de la maqueta: da la altura de la hoja.
 */
export function useBalancedColumns(
  sections: BalanceSection[],
  rootRef?: React.RefObject<HTMLElement>,
): BalancedColumns {
  const leftRef = useRef<HTMLElement | null>(null);
  const rightRef = useRef<HTMLElement | null>(null);
  const probeLeftRef = useRef<HTMLDivElement | null>(null);
  const probeRightRef = useRef<HTMLDivElement | null>(null);

  const movable = sections.filter((section) => section.columns.length > 1);
  const hasMovable = movable.length > 0;

  const [assignment, setAssignment] = useState<Assignment>(() => initialAssignment(sections));
  const sizes = useRef<Sizes>({});
  const passes = useRef(0);
  // Anchos reales de cada columna: la capa de medición los replica para que
  // el alto de una sección sea el mismo que tendrá si se muda de lado.
  const [widths, setWidths] = useState<Record<ColumnKey, number>>({ left: 0, right: 0 });
  // La clave evita re-medir cuando solo cambian datos que no afectan al alto.
  const signature = sections.map((s) => s.id).join('|');

  useLayoutEffect(() => {
    setAssignment(initialAssignment(sections));
    passes.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // Se mide después de cada render porque el alto depende del contenido que
  // acaba de cambiar de columna. El contador de pasadas corta cualquier
  // cadena de actualización.
  // Se mide después de cada render porque el alto depende del contenido que
  // acaba de cambiar. Como el reparto se calcula enumerando combinaciones, una
  // sola pasada basta: no hay convergencia que iterar.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!hasMovable) return;

    const probeLeft = probeLeftRef.current;
    const probeRight = probeRightRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!probeLeft || !probeRight || !left || !right) return;

    const measured: Sizes = {};
    for (const [key, probe] of [['left', probeLeft], ['right', probeRight]] as const) {
      probe.querySelectorAll<HTMLElement>('[data-cvs]').forEach((element) => {
        const id = element.dataset.cvs;
        if (!id) return;
        measured[id] = { ...measured[id], [key]: element.getBoundingClientRect().height };
      });
    }
    sizes.current = measured;

    // La primera pasada solo fija los anchos de la capa de medición; sin ellos
    // los altos medidos no sirven y el balanceo decidiría sobre cifras falsas.
    const nextWidths = { left: left.clientWidth, right: right.clientWidth };
    if (widths.left !== nextWidths.left || widths.right !== nextWidths.right) {
      setWidths(nextWidths);
      return;
    }

    // Capacidad = alto útil antes de que el contenido salte a la página 2.
    // Se toma el `min-height` de la maqueta, no su alto actual: si el
    // contenido ya desborda, el alto crece y dejaría de ser un límite.
    const root = rootRef?.current;
    let page = 0;
    if (root) {
      const minHeight = parseFloat(getComputedStyle(root).minHeight);
      page = Number.isFinite(minHeight) ? minHeight : root.clientHeight;
    }
    if (!page) page = Math.max(left.clientHeight, right.clientHeight);
    // Cada columna resta su propio relleno: es lo que realmente puede usar.
    const usable = (element: HTMLElement) => {
      const style = getComputedStyle(element);
      return element.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    };
    const capacity = Math.min(usable(left), usable(right), page);
    if (capacity <= 0) return;

    const next = planAssignment(sections, measured, capacity);
    if (JSON.stringify(next) === JSON.stringify(assignment)) return;
    setAssignment(next);
  });

  // Solo un cambio de ANCHO obliga a rehacer el reparto: si se reaccionara al
  // alto, mover una sección cambiaría la altura de su columna y dispararía
  // otro reparto, que la volvería a mover, en bucle.
  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right || typeof ResizeObserver === 'undefined') return;
    const last = { left: left.clientWidth, right: right.clientWidth };
    const observer = new ResizeObserver(() => {
      const next = { left: left.clientWidth, right: right.clientWidth };
      const changed = next.left !== last.left || next.right !== last.right;
      last.left = next.left;
      last.right = next.right;
      if (!changed) return;
      passes.current = 0;
      setAssignment(initialAssignment(sections));
    });
    observer.observe(left);
    observer.observe(right);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const byId = new Map(sections.map((section) => [section.id, section]));
  const render = (key: ColumnKey) =>
    assignment[key]
      .map((id) => byId.get(id)?.node)
      .filter((node): node is ReactNode => node !== undefined && node !== null);

  // Se miden TODAS las secciones, no solo las móviles: las fijas también
  // aportan altura a su columna y obviarlas haría que el balanceo creyera que
  // una columna está más vacía de lo que está.
  const probeSections = sections.map((section) => (
    <div key={section.id} data-cvs={section.id}>
      {section.node}
    </div>
  ));

  return {
    left: render('left'),
    right: render('right'),
    leftRef: (node) => { leftRef.current = node; },
    rightRef: (node) => { rightRef.current = node; },
    probe: hasMovable ? (
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[-1] h-0 w-0 overflow-hidden opacity-0"
      >
        <div ref={probeLeftRef} style={{ width: widths.left || undefined }}>{probeSections}</div>
        <div ref={probeRightRef} style={{ width: widths.right || undefined }}>{probeSections}</div>
      </div>
    ) : null,
  };
}
