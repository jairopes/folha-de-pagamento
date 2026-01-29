
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
    <div className="min-h-screen flex items-center justify-center bg-[#FFB100] px-4 transition-colors duration-500">
      <div className="max-w-md w-full space-y-8 p-10 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl">
        <div className="text-center">
          <div className="inline-flex p-4 bg-gray-900 rounded-3xl text-[#FFB100] shadow-2xl mb-6">
            <Wallet size={32} />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">RH Master</h2>
          <p className="mt-2 text-sm text-gray-400 font-black uppercase tracking-widest">Acesso Restrito</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all placeholder-gray-400 font-medium"
                placeholder="E-mail corporativo"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-all placeholder-gray-400 font-medium"
                placeholder="Senha de acesso"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-black animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-black text-sm transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
        
        <p className="text-center text-[10px] text-gray-400 font-black uppercase tracking-widest">
          RH MASTER SECURITY • SSL ENCRYPTED
        </p>
      </div>
    </div>
  );
};

export default Login;
