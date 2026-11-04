import { NextRequest, NextResponse } from 'next/server';
import { aiError } from '@/lib/aiErrors';
import { getRequestLocale } from '@/lib/i18n/server';
import { getAiUsageSummary } from '@/lib/aiQuota';

// La ruta depende de cabeceras (usuario/IP); nunca debe prerenderizarse.
export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/usage
 * Estado de uso diario de la IA para la persona que consulta (por usuario
 * autenticado o IP anónima). No expone detalles internos del proveedor.
 */
export async function GET(request: NextRequest) {
  try {
    const usage = await getAiUsageSummary(request);
    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error en /api/ai/usage:', error);
    return NextResponse.json({ error: aiError(getRequestLocale(request), 'usageFailed') }, { status: 500 });
  }
}
