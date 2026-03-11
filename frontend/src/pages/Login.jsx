import { useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('kioskToken', data.token);
      navigate('/');
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.message || 'Invalid username or password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-100 via-white to-orange-100 p-4 sm:p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl sm:p-8">
        <h1 className="mb-2 text-2xl font-black text-slate-800 sm:text-3xl">Kiosk Login</h1>
        <p className="mb-6 text-sm text-slate-500">Admin access only</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
