'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useRegistrarGuia } from '@/hooks/useGuias';
import { useState } from 'react';
import { extractApiErrorMessage } from '@/utils/format';

const schema = z.object({
  numero_guia: z
    .string()
    .min(1, 'El número de guía es requerido')
    .transform((v) => v.trim()),
  asesor: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100)
    .transform((v) => v.trim()),
  cliente: z
    .string()
    .max(200)
    .optional()
    .transform((v) => v?.trim() || undefined),
});

type FormValues = z.input<typeof schema>;

export function GuiaForm() {
  const { mutateAsync, isPending } = useRegistrarGuia();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setApiError(null);
    try {
      await mutateAsync({
        numero_guia: values.numero_guia,
        asesor: values.asesor,
        cliente: values.cliente,
      });
      reset();
    } catch (err) {
      setApiError(extractApiErrorMessage(err));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {apiError && (
        <Alert variant="error" onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

      <Input
        label="Número de guía"
        placeholder="Ej: 8765432100"
        required
        autoFocus
        inputMode="numeric"
        error={errors.numero_guia?.message}
        {...register('numero_guia')}
      />

      <Input
        label="Asesor"
        placeholder="Nombre del asesor"
        required
        error={errors.asesor?.message}
        {...register('asesor')}
      />

      <Input
        label="Cliente"
        placeholder="Nombre del cliente"
        error={errors.cliente?.message}
        {...register('cliente')}
      />

      <div className="flex gap-3 pt-1">
        <Button type="submit" isLoading={isPending} className="flex-1">
          {isPending ? 'Registrando...' : 'Registrar guía'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => { reset(); setApiError(null); }}
          disabled={isPending}
        >
          Limpiar
        </Button>
      </div>
    </form>
  );
}
