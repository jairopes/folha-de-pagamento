
import React, { useState, useEffect, useMemo } from 'react';
import { Save, RefreshCcw, Download, Calculator, CheckCircle2, Trash2, AlertCircle, Info, Building2 } from 'lucide-react';
import { Employee, PayrollRecord } from '../types';

interface Props {
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  onSaveBatch: (records: Omit<PayrollRecord, 'id'>[]) => void;
}

const BatchPayrollView: React.FC<Props> = ({ employees, payrollRecords, onSaveBatch }) => {
  const [closingDate, setClosingDate] = useState(new Date().toLocaleDateString('pt-BR'));
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [batchData, setBatchData] = useState<Record<string, Omit<PayrollRecord, 'id' | 'employeeId' | 'closingDate'>>>({});

  const visibleEmployees = useMemo(() => {
    if (!companyFilter) return employees;
    return employees.filter(e => e.company === companyFilter);
  }, [employees, companyFilter]);

  useEffect(() => {
    const initialData: Record<string, any> = { ...batchData };
    employees.forEach(emp => {
      if (!initialData[emp.id]) {
        initialData[emp.id] = {
          otherIncome: 0,
          bonuses: 0,
          vt: false,
          basicBasket: 0,
          ot100: 0,
          ot70: 0,
          ot50: 0,
          vr: 0,
          advances: 0,
          absences: 0,
          loans: 0,
          otherDiscounts: 0,
          pharmacy: 0,
          supermarket: 0,
          dental: 0,
          medical: 0,
          otherConvenios: 0,
          observations: '',
        };
      }
    });
    setBatchData(initialData);
  }, [employees]);

  const formatDateMask = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length <= 2) return v;
    if (v.length <= 4) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
  };

  const handleInputChange = (employeeId: string, field: string, value: any) => {
    setBatchData(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  const clearBatch = () => {
    if (!confirm("Isso irá zerar os valores visíveis na grade. Continuar?")) return;
    const newData = { ...batchData };
    visibleEmployees.forEach(emp => {
      newData[emp.id] = {
        otherIncome: 0,
        bonuses: 0,
        vt: false,
        basicBasket: 0,
        ot100: 0,
        ot70: 0,
        ot50: 0,
        vr: 0,
        advances: 0,
        absences: 0,
        loans: 0,
        otherDiscounts: 0,
        pharmacy: 0,
        supermarket: 0,
        dental: 0,
        medical: 0,
        otherConvenios: 0,
        observations: '',
      };
    });
    setBatchData(newData);
  };

  const repeatLastMonth = () => {
    const newData = { ...batchData };
    let foundCount = 0;

    visibleEmployees.forEach(emp => {
      const lastRecord = [...payrollRecords]
        .filter(r => r.employeeId === emp.id)
        .sort((a, b) => b.closingDate.localeCompare(a.closingDate))[0];

      if (lastRecord) {
        const { id, employeeId, closingDate: cd, ...rest } = lastRecord;
        newData[emp.id] = { ...rest };
        foundCount++;
      }
    });

    setBatchData(newData);
    if (foundCount > 0) {
      alert(`${foundCount} registros da empresa ${companyFilter || 'Geral'} foram repetidos.`);
    }
  };

  const calculateNet = (emp: Employee) => {
    const data = batchData[emp.id];
    if (!data) return 0;
    const earnings = emp.salary + emp.roleAccumulation + data.otherIncome + data.bonuses + data.basicBasket + data.vr;
    const absenceValue = (emp.salary / 30) * data.absences;
    const deductions = data.advances + absenceValue + data.loans + data.pharmacy + data.supermarket + data.dental + data.medical + data.otherConvenios + data.otherDiscounts;
    return earnings - deductions;
  };

  const exportBatchToExcel = () => {
    if (visibleEmployees.length === 0) return;

    const header = [
      "Empresa", "Nome", "Cargo", "Salário Base", "Acúmulo", 
      "Outros Rend.", "Prêmios", "Cesta Básica", "VR", "HE 100%", "HE 70%", "HE 50%", "VT",
      "Adiantamentos", "Faltas (Dias)", "Empréstimos", "Farmácia", "Supermercado", 
      "Odonto", "Médico", "Convênios", "Desc. Diversos", "Líquido Final"
    ];

    const rows = visibleEmployees.map(emp => {
      const d = batchData[emp.id];
      return [
        emp.company,
        emp.name,
        emp.role,
        emp.salary,
        emp.roleAccumulation,
        d?.otherIncome || 0,
        d?.bonuses || 0,
        d?.basicBasket || 0,
        d?.vr || 0,
        d?.ot100 || 0,
        d?.ot70 || 0,
        d?.ot50 || 0,
        d?.vt ? "Sim" : "Não",
        d?.advances || 0,
        d?.absences || 0,
        d?.loans || 0,
        d?.pharmacy || 0,
        d?.supermarket || 0,
        d?.dental || 0,
        d?.medical || 0,
        d?.otherConvenios || 0,
        d?.otherDiscounts || 0,
        calculateNet(emp)
      ].map(v => typeof v === 'number' ? v.toFixed(2).replace('.', ',') : v).join(';');
    });

    const csvContent = "\uFEFF" + [header.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `folha_${companyFilter || 'Geral'}_${closingDate.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFinalize = () => {
    if (visibleEmployees.length === 0) return;
    if (!confirm(`Deseja salvar a folha de ${visibleEmployees.length} colaboradores (${companyFilter || 'Todas Empresas'})?`)) return;

    const newRecords: Omit<PayrollRecord, 'id'>[] = visibleEmployees.map(emp => ({
      employeeId: emp.id,
      closingDate: closingDate,
      ...batchData[emp.id]
    }));

    onSaveBatch(newRecords);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            Fechamento Mensal
            <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-1 rounded-md font-black uppercase tracking-widest">Contábil</span>
          </h1>
          <p className="text-gray-500 text-sm">Preencha e exporte a folha detalhada por empresa.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-[#111] border border-gray-800 p-2 rounded-2xl flex items-center gap-2 shadow-inner">
            <span className="text-[10px] text-gray-500 font-black px-2 uppercase tracking-widest">Referência</span>
            <input 
              type="text" 
              placeholder="DD/MM/AAAA"
              value={closingDate} 
              onChange={e => setClosingDate(formatDateMask(e.target.value))} 
              className="bg-black text-white border-none focus:outline-none text-sm w-28 px-2 py-1 rounded-lg font-mono" 
            />
            <div className="w-px h-6 bg-gray-800 mx-1"></div>
            <Building2 size={16} className="text-gray-500 ml-1" />
            <select 
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-black text-gray-400 text-xs border-none focus:outline-none px-2 py-1 appearance-none"
            >
              <option value="">Empresa (Todas)</option>
              <option value="CAMPLUVAS">CAMPLUVAS</option>
              <option value="LOCATEX">LOCATEX</option>
            </select>
          </div>
          
          <button onClick={repeatLastMonth} className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all border border-gray-700">
            <RefreshCcw size={16} /> Repetir
          </button>

          <button onClick={clearBatch} className="bg-red-900/10 hover:bg-red-900/20 text-red-500 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all border border-red-500/20">
            <Trash2 size={16} /> Limpar
          </button>

          <button onClick={exportBatchToExcel} className="bg-green-800/20 hover:bg-green-800/40 text-green-500 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all border border-green-500/20">
            <Download size={16} /> Excel
          </button>

          <button onClick={handleFinalize} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-black transition-all shadow-xl shadow-blue-900/20">
            <CheckCircle2 size={18} /> Salvar Tudo
          </button>
        </div>
      </header>

      <div className="bg-[#111] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="w-full text-left border-collapse table-fixed min-w-[3200px]">
            <thead className="sticky top-0 z-40 bg-[#111]">
              <tr className="border-b border-gray-800">
                <th className="w-[300px] sticky left-0 bg-gray-900 z-50 px-6 py-2 border-r border-gray-800"></th>
                <th className="w-[180px] bg-gray-900/40 px-4 py-2 text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] border-r border-gray-800/30">Dados</th>
                <th colSpan={10} className="bg-green-900/10 px-4 py-2 text-[10px] font-black uppercase text-green-500 tracking-[0.3em] text-center border-r border-gray-800/30">Proventos</th>
                <th colSpan={9} className="bg-red-900/10 px-4 py-2 text-[10px] font-black uppercase text-red-500 tracking-[0.3em] text-center border-r border-gray-800/30">Descontos</th>
                <th className="w-[180px] sticky right-0 bg-gray-900 z-50 px-6 py-2 text-center text-[10px] font-black uppercase text-blue-400 tracking-[0.2em]">Líquido</th>
              </tr>
              <tr className="bg-gray-900/80 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-800 backdrop-blur-md">
                <th className="px-6 py-5 sticky left-0 bg-gray-900 z-50 border-r border-gray-800">Colaborador</th>
                <th className="px-4 py-5 border-r border-gray-800/30">Base (R$)</th>
                <th className="px-3 py-5 w-[120px]">Outros (+)</th>
                <th className="px-3 py-5 w-[120px]">Prêmios (+)</th>
                <th className="px-3 py-5 w-[120px]">Cesta (+)</th>
                <th className="px-3 py-5 w-[120px]">VR (+)</th>
                <th className="px-3 py-5 w-[100px]">HE 100%</th>
                <th className="px-3 py-5 w-[100px]">HE 70%</th>
                <th className="px-3 py-5 w-[100px]">HE 50%</th>
                <th className="px-3 py-5 w-[100px] text-center">VT?</th>
                <th className="px-3 py-5 w-[120px] invisible"></th>
                <th className="px-3 py-5 border-r border-gray-800/30 w-[120px] invisible"></th>
                
                <th className="px-3 py-5 w-[120px]">Adiant. (-)</th>
                <th className="px-3 py-5 w-[100px]">Faltas (d)</th>
                <th className="px-3 py-5 w-[120px]">Emprést. (-)</th>
                <th className="px-3 py-5 w-[120px]">Farmác. (-)</th>
                <th className="px-3 py-5 w-[120px]">Superm. (-)</th>
                <th className="px-3 py-5 w-[120px]">Odonto (-)</th>
                <th className="px-3 py-5 w-[120px]">Médico (-)</th>
                <th className="px-3 py-5 w-[120px]">Convên. (-)</th>
                <th className="px-3 py-5 border-r border-gray-800/30 w-[120px]">Diversos (-)</th>
                
                <th className="px-6 py-5 sticky right-0 bg-gray-900 z-50 text-right border-l border-gray-800">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-xs">
              {visibleEmployees.length === 0 ? (
                <tr>
                  <td colSpan={25} className="px-6 py-32 text-center text-gray-600 italic">
                    Nenhum colaborador encontrado para esta empresa.
                  </td>
                </tr>
              ) : (
                visibleEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-blue-600/[0.03] transition-colors group">
                    <td className="px-6 py-4 sticky left-0 bg-[#111] z-30 border-r border-gray-800/30 group-hover:bg-[#141414]">
                      <div className="flex items-center gap-2">
                         <span className={`w-2 h-2 rounded-full ${emp.company === 'CAMPLUVAS' ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                         <div className="font-bold text-gray-200 group-hover:text-blue-400 transition-colors truncate">{emp.name}</div>
                      </div>
                      <div className="text-[9px] text-gray-600 uppercase font-bold tracking-tight mt-0.5 truncate ml-4">{emp.role}</div>
                    </td>
                    <td className="px-4 py-4 font-mono text-gray-500 border-r border-gray-800/30">
                      {(emp.salary + emp.roleAccumulation).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    
                    <td className="px-2 py-4">
                      <input type="number" step="0.01" value={batchData[emp.id]?.otherIncome || ''} onChange={e => handleInputChange(emp.id, 'otherIncome', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-green-500 focus:outline-none font-mono text-[11px] text-green-400" placeholder="0,00" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="0.01" value={batchData[emp.id]?.bonuses || ''} onChange={e => handleInputChange(emp.id, 'bonuses', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-green-500 focus:outline-none font-mono text-[11px] text-green-400" placeholder="0,00" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="0.01" value={batchData[emp.id]?.basicBasket || ''} onChange={e => handleInputChange(emp.id, 'basicBasket', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-green-500 focus:outline-none font-mono text-[11px] text-green-400" placeholder="0,00" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="0.01" value={batchData[emp.id]?.vr || ''} onChange={e => handleInputChange(emp.id, 'vr', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-green-500 focus:outline-none font-mono text-[11px] text-green-400" placeholder="0,00" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="1" value={batchData[emp.id]?.ot100 || ''} onChange={e => handleInputChange(emp.id, 'ot100', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-green-500 focus:outline-none font-mono text-[11px]" placeholder="0" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="1" value={batchData[emp.id]?.ot70 || ''} onChange={e => handleInputChange(emp.id, 'ot70', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-green-500 focus:outline-none font-mono text-[11px]" placeholder="0" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="1" value={batchData[emp.id]?.ot50 || ''} onChange={e => handleInputChange(emp.id, 'ot50', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-green-500 focus:outline-none font-mono text-[11px]" placeholder="0" />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <input type="checkbox" checked={batchData[emp.id]?.vt || false} onChange={e => handleInputChange(emp.id, 'vt', e.target.checked)} className="w-5 h-5 accent-blue-600 bg-black/40 border border-gray-800" />
                    </td>
                    <td className="w-[120px]"></td>
                    <td className="border-r border-gray-800/30 w-[120px]"></td>

                    <td className="px-2 py-4">
                      <input type="number" step="0.01" value={batchData[emp.id]?.advances || ''} onChange={e => handleInputChange(emp.id, 'advances', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-red-500 focus:outline-none font-mono text-[11px] text-red-400" placeholder="0,00" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="1" value={batchData[emp.id]?.absences || ''} onChange={e => handleInputChange(emp.id, 'absences', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-red-500 focus:outline-none font-mono text-[11px] text-red-400" placeholder="0" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="0.01" value={batchData[emp.id]?.loans || ''} onChange={e => handleInputChange(emp.id, 'loans', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-red-500 focus:outline-none font-mono text-[11px] text-red-400" placeholder="0,00" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="0.01" value={batchData[emp.id]?.pharmacy || ''} onChange={e => handleInputChange(emp.id, 'pharmacy', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-red-500 focus:outline-none font-mono text-[11px] text-red-400" placeholder="0,00" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="0.01" value={batchData[emp.id]?.supermarket || ''} onChange={e => handleInputChange(emp.id, 'supermarket', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-red-500 focus:outline-none font-mono text-[11px] text-red-400" placeholder="0,00" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="0.01" value={batchData[emp.id]?.dental || ''} onChange={e => handleInputChange(emp.id, 'dental', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-red-500 focus:outline-none font-mono text-[11px] text-red-400" placeholder="0,00" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="0.01" value={batchData[emp.id]?.medical || ''} onChange={e => handleInputChange(emp.id, 'medical', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-red-500 focus:outline-none font-mono text-[11px] text-red-400" placeholder="0,00" />
                    </td>
                    <td className="px-2 py-4">
                      <input type="number" step="0.01" value={batchData[emp.id]?.otherConvenios || ''} onChange={e => handleInputChange(emp.id, 'otherConvenios', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-red-500 focus:outline-none font-mono text-[11px] text-red-400" placeholder="0,00" />
                    </td>
                    <td className="px-2 py-4 border-r border-gray-800/30">
                      <input type="number" step="0.01" value={batchData[emp.id]?.otherDiscounts || ''} onChange={e => handleInputChange(emp.id, 'otherDiscounts', parseFloat(e.target.value) || 0)} className="w-full bg-black/40 border border-gray-800/50 rounded-lg px-2 py-2 focus:border-red-500 focus:outline-none font-mono text-[11px] text-red-400" placeholder="0,00" />
                    </td>

                    <td className="px-6 py-4 sticky right-0 bg-[#111] z-30 border-l border-gray-800 text-right font-mono text-blue-400 font-black text-sm whitespace-nowrap group-hover:bg-[#141414]">
                      {calculateNet(emp).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 bg-blue-600/5 border border-blue-500/20 p-8 rounded-[2.5rem] flex items-center justify-between shadow-lg">
          <div className="flex gap-6 items-center">
            <div className="p-5 bg-blue-600 rounded-[2rem] text-white shadow-2xl shadow-blue-900/40 transform rotate-3">
              <Calculator size={32} />
            </div>
            <div>
              <h4 className="font-black text-white text-xl leading-tight uppercase tracking-tighter">Total da Folha Detalhada</h4>
              <p className="text-xs text-gray-500 font-medium">Soma consolidada de todos os líquidos após proventos e descontos discriminados.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Impacto Financeiro Total</p>
            <p className="text-4xl font-mono text-blue-400 font-black tracking-tighter">
              {visibleEmployees.reduce((acc, emp) => acc + calculateNet(emp), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-[2.5rem] flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <Info size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Informação</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed font-medium">
            O arquivo gerado para o contador conterá todas as colunas de rendimentos e descontos individualizadas para facilitar a importação no sistema contábil.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BatchPayrollView;
