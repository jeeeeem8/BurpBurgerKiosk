import { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import api, { isApiUnavailable, isHostingOnlyMode } from '../services/api.js';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isLogoReady, setIsLogoReady] = useState(true);
  const demoUsername = import.meta.env.VITE_DEMO_USERNAME || 'admin';
  const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || 'admin123';
  const demoToken = import.meta.env.VITE_DEMO_TOKEN || 'kiosk-admin-token';

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (isHostingOnlyMode) {
      if (form.username === demoUsername && form.password === demoPassword) {
        localStorage.setItem('kioskToken', demoToken);
        await Swal.fire({
          icon: 'info',
          title: 'Demo Mode Enabled',
          text: 'Signed in without backend API.',
          timer: 1400,
          showConfirmButton: false,
        });
        navigate('/');
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: 'Invalid demo credentials.',
        });
      }

      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('kioskToken', data.token);
      navigate('/');
    } catch (error) {
      if (isApiUnavailable(error) && form.username === demoUsername && form.password === demoPassword) {
        localStorage.setItem('kioskToken', demoToken);
        await Swal.fire({
          icon: 'info',
          title: 'Demo Mode Enabled',
          text: 'API is offline. You are signed in using local demo mode.',
          timer: 1600,
          showConfirmButton: false,
        });
        navigate('/');
        return;
      }

      await Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: isApiUnavailable(error)
          ? 'API is offline and demo credentials did not match.'
          : (error.response?.data?.message || 'Invalid username or password.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-gradient-to-br from-amber-100 via-white to-orange-100 md:min-h-[100dvh] md:overflow-visible">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center gap-4 px-3 md:min-h-[100dvh] md:max-w-none md:grid md:grid-cols-[0.95fr_1.05fr] md:items-center md:gap-2 md:px-6 md:py-4 lg:gap-4 lg:px-10">
        <section className="flex w-full flex-none flex-col items-center px-0 pt-0 text-center md:items-end md:justify-center md:px-0 md:pr-[5%] md:pt-0 md:text-right">
          {isLogoReady ? (
            <div className="w-full max-w-none md:h-auto md:w-auto md:max-w-none md:overflow-visible md:rounded-none">
              <picture>
                <source media="(min-width: 768px)" srcSet="/kiosklogo.png" />
                <img
                  src="/kiosklogo-trimmed.png"
                  alt="Burp Burger Kiosk"
                  className="mx-auto h-auto max-h-[25dvh] w-full object-contain md:mx-0 md:max-h-none md:h-[24rem] md:w-auto md:max-w-none lg:h-[29rem] xl:h-[33rem]"
                  onError={() => setIsLogoReady(false)}
                />
              </picture>
            </div>
          ) : (
            <div className="rounded-full bg-white/70 px-5 py-2 text-sm font-bold tracking-wide text-slate-700 shadow-sm md:text-base">
              BURP BURGER KIOSK
            </div>
          )}
        </section>

        <section className="w-full max-w-none rounded-2xl bg-white px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.12)] md:mt-0 md:mb-0 md:w-full md:max-w-[46rem] md:rounded-3xl md:p-8 md:shadow-xl lg:p-10">
          <h1 className="mb-3 text-xl font-black text-slate-800 sm:text-3xl md:mb-5 md:text-3xl">Kiosk Login</h1>

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium md:text-sm">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm md:rounded-xl md:px-4 md:py-2"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium md:text-sm">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm md:rounded-xl md:px-4 md:py-2"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70 md:rounded-xl md:py-2.5 md:text-base"
            >
              {isLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
