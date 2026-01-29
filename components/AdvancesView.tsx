
import React, { useState, useEffect } from 'react';
import { Download, Search, HandCoins, Calculator, MessageSquare, AlertCircle } from 'lucide-react';
import { Employee } from '../types';

interface Props {
  employees: Employee[];
}

interface ExtraAdvanceData {
  otherAdvances: number;
  observations: string;
}

const AdvancesView: React.FC<Props> = ({ employees }) => {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [extraData, setExtraData] = useState<Record<string, ExtraAdvanceData>>({});

  // Inicializa o estado extra quando os funcionários carregarem
  useEffect(() => {
    const initial: Record<string, ExtraAdvanceData> = {};
    employees.forEach(emp => {
      if (!extraData[emp.id]) {
        initial[emp.id] = { otherAdvances: 0, observations: '' };
      }
    });
    if (Object.keys(initial).length > 0) {
      setExtraData(prev => ({ ...prev, ...initial }));
    }
  }, [employees]);

  const formatDateMask = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length <= 2) return v;
    if (v.length <= 4) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
  };

  const handleExtraChange = (id: string, field: keyof ExtraAdvanceData, value: any) => {
    setExtraData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const calculate40Percent = (salary: number, accumulation: number) => {
    return (salary + accumulation) * 0.40;
  };

  const calculateTotal = (emp: Employee) => {
    const p40 = calculate40Percent(emp.salary, emp.roleAccumulation);
    const other = extraData[emp.id]?.otherAdvances || 0;
    return p40 + other;
  };

  const exportAdvancesToExcel = () => {
    if (employees.length === 0) return alert("Nenhum colaborador para exportar");

    const header = [
      "Funcionario", 
      "Cargo", 
      "Salario Base", 
      "Acumulo de Funcao", 
      "Adiantamento (40%)", 
      "Outros Adiantamentos",
      "Total Geral",
      "Observações",
      "Periodo Inicio", 
      "Periodo Fim"
    ];

    const rows = employees.map(emp => {
      const p40 = calculate40Percent(emp.salary, emp.roleAccumulation);
      const other = extraData[emp.id]?.otherAdvances || 0;
      const total = p40 + other;
      const obs = extraData[emp.id]?.observations || "";

      return [
        emp.name,
        emp.role,
        emp.salary,
        emp.roleAccumulation,
        p40,
        other,
        total,
        obs,
        periodStart || "N/A",
        periodEnd || "N/A"
      ].map(val => typeof val === 'number' ? val.toFixed(2).replace('.', ',') : val).join(';');
    });

    const csvContent = "\uFEFF" + [header.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_adiantamentos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const grandTotal = employees.reduce((acc, emp) => acc + calculateTotal(emp), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            Adiantamentos (40%)
            <span className="text-[10px] bg-green-900/50 text-green-400 px-2 py-1 rounded-md font-black uppercase tracking-widest">Quinzenal</span>
          </h1>
          <p className="text-gray-500 text-sm">Cálculo de 40% (Base + Acúmulo) com suporte a valores extras e observações.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#111] border border-gray-800 p-2 rounded-2xl shadow-inner">
            <span className="text-[10px] text-gray-500 font-black px-2 uppercase tracking-widest">Início</span>
            <input 
              type="text" 
              placeholder="DD/MM/AAAA" 
              value={periodStart} 
              onChange={e => setPeriodStart(formatDateMask(e.target.value))} 
              className="bg-black text-white border-none focus:outline-none text-sm w-28 px-2 py-1 rounded-lg font-mono" 
            />
            <span className="text-[10px] text-gray-500 font-black px-2 uppercase tracking-widest">Fim</span>
            <input 
              type="text" 
              placeholder="DD/MM/AAAA" 
              value={periodEnd} 
              onChange={e => setPeriodEnd(formatDateMask(e.target.value))} 
              className="bg-black text-white border-none focus:outline-none text-sm w-28 px-2 py-1 rounded-lg font-mono" 
            />
          </div>
          
          <button 
            onClick={exportAdvancesToExcel} 
            className="bg-green-600 hover:bg-green-500 px-6 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-black transition-all shadow-xl shadow-green-900/20"
          >
            <Download size={18} /> Exportar Planilha
          </button>
        </div>
      </header>

      <div className="bg-[#111] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-900/80 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-800 backdrop-blur-md">
              <tr>
                <th className="px-6 py-5 min-w-[200px] sticky left-0 bg-gray-900 z-10">Colaborador</th>
                <th className="px-6 py-5 text-right min-w-[140px]">Base + Acúmulo</th>
                <th className="px-6 py-5 text-right min-w-[140px] text-blue-400">40% (Direito)</th>
                <th className="px-6 py-5 text-center min-w-[160px] text-green-400">Outros (+)</th>
                <th className="px-6 py-5 text-center min-w-[240px]">Observações</th>
                <th className="px-6 py-5 text-right min-w-[160px] text-white">Total Geral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 text-xs">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center text-gray-600 italic">
                    <div className="flex flex-col items-center gap-3">
                      <HandCoins size={48} className="opacity-10" />
                      <p>Nenhum colaborador cadastrado para o cálculo de adiantamento.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const p40 = calculate40Percent(emp.salary, emp.roleAccumulation);
                  return (
                    <tr key={emp.id} className="hover:bg-blue-600/[0.03] transition-colors group">
                      <td className="px-6 py-4 sticky left-0 bg-[#111] z-10 border-r border-gray-800/30 group-hover:bg-[#141414]">
                        <div className="font-bold text-gray-200 group-hover:text-blue-400 transition-colors">{emp.name}</div>
                        <div className="text-[9px] text-gray-600 uppercase font-bold tracking-tight mt-0.5">{emp.role}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-gray-500">
                        {(emp.salary + emp.roleAccumulation).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-blue-400/80 font-bold">
                        {p40.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-4 py-4">
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0,00"
                          value={extraData[emp.id]?.otherAdvances || ''}
                          onChange={e => handleExtraChange(emp.id, 'otherAdvances', parseFloat(e.target.value) || 0)}
                          className="w-full bg-black/40 border border-gray-800/50 rounded-xl px-3 py-2 focus:border-green-500 focus:outline-none font-mono text-[11px] text-green-400 text-center transition-all"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative group/obs">
                          <MessageSquare size={12} className="absolute left-3 top-3 text-gray-600" />
                          <textarea 
                            rows={1}
                            placeholder="Notas deste adiantamento..."
                            value={extraData[emp.id]?.observations || ''}
                            onChange={e => handleExtraChange(emp.id, 'observations', e.target.value)}
                            className="w-full bg-black/40 border border-gray-800/50 rounded-xl pl-8 pr-3 py-2.5 focus:border-blue-500 focus:outline-none text-[10px] text-gray-400 transition-all resize-none overflow-hidden"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-white font-black text-sm whitespace-nowrap bg-white/[0.01]">
                        {calculateTotal(emp).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {employees.length > 0 && (
              <tfoot className="bg-gray-900/40 border-t border-gray-800">
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-right text-[10px] font-black uppercase text-gray-500 tracking-widest">Total a Desembolsar (Adiantamentos)</td>
                  <td className="px-6 py-6 text-right font-mono text-green-400 font-black text-xl">
                    {grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-[2rem] flex items-start gap-6">
          <div className="p-4 bg-blue-600 rounded-3xl text-white shadow-2xl shadow-blue-900/40">
            <Calculator size={24} />
          </div>
          <div>
            <h4 className="font-black text-blue-400 text-sm mb-2 uppercase tracking-tight">Memória de Cálculo</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              O sistema gera automaticamente o valor de 40% sobre o <span className="text-gray-300">Salário Base + Acúmulo de Função</span>. 
              Você pode adicionar <span className="text-green-500">Outros Adiantamentos</span> manualmente (ex: reembolsos) e registrar o motivo no campo de <span className="text-blue-400">Observações</span>.
            </p>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-[2rem] flex items-start gap-6">
          <div className="p-4 bg-gray-800 rounded-3xl text-gray-400">
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 className="font-black text-gray-400 text-sm mb-2 uppercase tracking-tight">Envio para Contabilidade</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Ao exportar a planilha, os valores de 40% e os valores extras serão listados em colunas separadas para que seu contador saiba exatamente a origem de cada lançamento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancesView;
