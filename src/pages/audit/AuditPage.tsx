import { ScrollText } from 'lucide-react';
import { useAuditLogs } from '@/hooks/useData';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState, PageHeader, TableSkeleton } from '@/components/ui/misc';
import { Table, THead, Th, TBody, Tr, Td } from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';

const ACTION_TONE: Record<string, 'green' | 'blue' | 'red' | 'gold' | 'gray'> = {
  crear: 'green',
  'crear-masivo': 'green',
  actualizar: 'blue',
  eliminar: 'red',
  'registrar-pago': 'gold',
  'registrar-gasto': 'red',
  exportar: 'blue',
  importar: 'gold',
  'generar-reporte': 'gray',
  'iniciar-sesion': 'gray',
  'cerrar-sesion': 'gray',
};

export default function AuditPage() {
  const logs = useAuditLogs();

  return (
    <div>
      <PageHeader title="Auditoría" subtitle="Registro local de acciones importantes" />
      <Card>
        {!logs ? (
          <TableSkeleton />
        ) : logs.length === 0 ? (
          <EmptyState icon={<ScrollText className="h-10 w-10" />} title="Sin actividad registrada" />
        ) : (
          <Table>
            <THead>
              <tr>
                <Th>Fecha</Th>
                <Th>Usuario</Th>
                <Th>Acción</Th>
                <Th>Entidad</Th>
                <Th>Detalle</Th>
              </tr>
            </THead>
            <TBody>
              {logs.map((l) => (
                <Tr key={l.id}>
                  <Td className="whitespace-nowrap text-zinc-500">{formatDateTime(l.createdAt)}</Td>
                  <Td className="font-medium">{l.userName}</Td>
                  <Td>
                    <Badge tone={ACTION_TONE[l.action] ?? 'gray'}>{l.action}</Badge>
                  </Td>
                  <Td className="capitalize">{l.entity}</Td>
                  <Td className="max-w-56 truncate text-zinc-500">{l.detail ?? '—'}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
