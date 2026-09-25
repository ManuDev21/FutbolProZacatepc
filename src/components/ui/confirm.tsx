import { AlertTriangle } from 'lucide-react';
import { Button } from './button';
import { Modal } from './modal';
import { useConfirmStore } from '@/stores/confirm';

/** Host del diálogo de confirmación global. Montar una vez en App. */
export function ConfirmHost() {
  const { open, title, message, confirmLabel, danger, answer } = useConfirmStore();
  return (
    <Modal open={open} onClose={() => answer(false)} title={title} size="sm">
      <div className="flex items-start gap-3">
        {danger && (
          <span className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/40">
            <AlertTriangle className="h-5 w-5" />
          </span>
        )}
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => answer(false)}>
          Cancelar
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => answer(true)}>
          {confirmLabel ?? 'Confirmar'}
        </Button>
      </div>
    </Modal>
  );
}
