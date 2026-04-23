'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useAuthContext } from '@/contexts/AuthContext';
import { extractApiErrorMessage } from '@/utils/format';
import { APP_NAME, IS_MOCK } from '@/lib/constants';

const schema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuthContext();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionExpired(params.get('session') === 'expired');
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setError(null);
    try {
      await login(values);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <Truck className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">{APP_NAME}</h1>
            <p className="mt-1 text-sm text-slate-400">Sistema de seguimiento de guías</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-slate-700 bg-slate-800 px-8 py-8 shadow-xl">
          <div className="mb-6 flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Acceso interno</h2>
          </div>

          {sessionExpired && (
            <Alert variant="warning" className="mb-4">
              Tu sesión expiró. Inicia sesión nuevamente.
            </Alert>
          )}

          {error && (
            <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">
                Usuario <span className="text-red-400">*</span>
              </label>
              <input
                placeholder="tu-usuario"
                autoComplete="username"
                autoFocus
                className="block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('username')}
              />
              {errors.username && (
                <p className="text-xs text-red-400">{errors.username.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">
                Contraseña <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                className="block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="mt-2 w-full"
              size="lg"
            >
              {isSubmitting ? 'Verificando...' : 'Ingresar'}
            </Button>
          </form>

          {IS_MOCK && (
            <div className="mt-4 rounded-md bg-slate-700/60 p-3">
              <p className="text-center text-xs text-slate-400">
                Modo demo: usuario <span className="font-mono text-slate-300">admin</span> / clave{' '}
                <span className="font-mono text-slate-300">tcc2024</span>
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Acceso restringido · Solo uso interno
        </p>
      </div>
    </div>
  );
}
