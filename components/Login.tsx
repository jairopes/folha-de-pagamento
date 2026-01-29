
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Wallet, LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-[#111] border border-gray-800 rounded-[2.5rem] shadow-2xl">
        <div className="text-center">
          <div className="inline-flex p-4 bg-blue-600 rounded-3xl text-white shadow-2xl shadow-blue-900/40 mb-6">
            <Wallet size={32} />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">RH Master</h2>
          <p className="mt-2 text-sm text-gray-500 font-medium uppercase tracking-widest">Acesso Restrito à Empresa</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-black border border-gray-800 rounded-2xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder-gray-700"
                placeholder="E-mail corporativo"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-black border border-gray-800 rounded-2xl text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder-gray-700"
                placeholder="Senha de acesso"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-900/10 border border-red-900/20 rounded-2xl text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <LogIn size={20} /> Entrar no Sistema
              </>
            )}
          </button>
        </form>
        
        <p className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          RH MASTER SECURITY • SSL ENCRYPTED
        </p>
      </div>
    </div>
  );
};

export default Login;
