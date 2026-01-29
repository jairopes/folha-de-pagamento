
import React, { useState, useEffect } from 'react';
import { Calculator, UserCircle, PlusCircle, MinusCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Employee, PayrollRecord } from '../types';

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
}

const InputField = ({ label, name, type = "text", placeholder = "", value, onChange, step = "0.01" }: InputFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      step={step}
      className="bg-black text-white border border-gray-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm"
    />
  </div>
);

const SectionHeader = ({ icon, title, colorClass }: { icon: React.ReactNode, title: string, colorClass: string }) => (
  <div className={`flex items-center gap-2 mb-6 p-4 rounded-2xl bg-gray-900/40 border border-gray-800`}>
    <div className={`p-2 rounded-lg ${colorClass}`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold tracking-tight">{title}</h3>
  </div>
);

interface Props {
  employees: Employee[];
  onSave: (record: Omit<PayrollRecord, 'id'>) => void;
}

const PayrollForm: React.FC<Props> = ({ employees, onSave }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Omit<PayrollRecord, 'id' | 'employeeId'>>({
    closingDate: new Date().toLocaleDateString('pt-BR'),
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
  });

  useEffect(() => {
    const emp = employees.find(e => e.id === selectedEmployeeId);
    setSelectedEmployee(emp || null);
  }, [selectedEmployeeId, employees]);

  const formatDateMask = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length <= 2) return v;
    if (v.length <= 4) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'closingDate') {
      setFormData(prev => ({ ...prev, [name]: formatDateMask(value) }));
      return;
    }

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateTotal = () => {
    if (!selectedEmployee) return 0;
    const earnings = 
      selectedEmployee.salary + 
      selectedEmployee.roleAccumulation + 
      formData.otherIncome + 
      formData.bonuses + 
      formData.basicBasket + 
      formData.vr;
    
    const deductions = 
      formData.advances + 
      formData.absences + 
      formData.loans + 
      formData.otherDiscounts + 
      formData.pharmacy + 
      formData.supermarket + 
      formData.dental + 
      formData.medical + 
      formData.otherConvenios;
    
    return earnings - deductions;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return alert('Selecione um funcionário');
    
    const record: Omit<PayrollRecord, 'id'> = {
      ...formData,
      employeeId: selectedEmployeeId
    };
    onSave(record);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Folha de Pagamento</h1>
          <p className="text-gray-500">Realize o fechamento mensal e cálculo de rendimentos/descontos.</p>
        </div>
        <div className="bg-[#111] border border-gray-800 p-4 rounded-2xl flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Total Líquido Estimado</p>
            <p className="text-2xl font-mono font-bold text-green-400">
              {calculateTotal().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="w-px h-10 bg-gray-800"></div>
          <button 
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-500 p-4 rounded-xl text-white shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
          >
            <CheckCircle2 size={24} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
            <SectionHeader icon={<UserCircle size={20} />} title="Funcionário" colorClass="bg-blue-900/30 text-blue-400" />
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Selecione o Colaborador</label>
                <select 
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="bg-black text-white border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Escolher...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <InputField label="Data de Fechamento" name="closingDate" placeholder="DD/MM/AAAA" value={formData.closingDate} onChange={handleChange} />
              
              {selectedEmployee && (
                <div className="mt-6 p-4 bg-gray-900/50 rounded-xl border border-gray-800 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Salário Base:</span>
                    <span className="font-mono text-gray-200">
                      {selectedEmployee.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Acúmulo Função:</span>
                    <span className="font-mono text-gray-200">
                      {selectedEmployee.roleAccumulation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
            <SectionHeader icon={<FileText size={20} />} title="Observações" colorClass="bg-gray-800 text-gray-400" />
            <textarea
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              rows={4}
              placeholder="Digite notas adicionais para este holerite..."
              className="w-full bg-black text-white border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
              <SectionHeader icon={<PlusCircle size={20} />} title="Rendimentos" colorClass="bg-green-900/30 text-green-400" />
              <div className="grid grid-cols-1 gap-4">
                <InputField label="Outros Rendimentos (R$)" name="otherIncome" type="number" value={formData.otherIncome} onChange={handleChange} />
                <InputField label="Prêmios (R$)" name="bonuses" type="number" value={formData.bonuses} onChange={handleChange} />
                <InputField label="Cesta Básica (R$)" name="basicBasket" type="number" value={formData.basicBasket} onChange={handleChange} />
                <InputField label="Vale Refeição (R$)" name="vr" type="number" value={formData.vr} onChange={handleChange} />
                
                <div className="grid grid-cols-3 gap-2">
                  <InputField label="H.E. 100%" name="ot100" type="number" value={formData.ot100} onChange={handleChange} step="1" />
                  <InputField label="H.E. 70%" name="ot70" type="number" value={formData.ot70} onChange={handleChange} step="1" />
                  <InputField label="H.E. 50%" name="ot50" type="number" value={formData.ot50} onChange={handleChange} step="1" />
                </div>

                <div className="flex items-center justify-between p-3 bg-black border border-gray-800 rounded-xl">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Vale Transporte?</span>
                  <input 
                    type="checkbox" 
                    name="vt" 
                    checked={formData.vt} 
                    onChange={handleChange}
                    className="w-5 h-5 accent-blue-600 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
              <SectionHeader icon={<MinusCircle size={20} />} title="Descontos" colorClass="bg-red-900/30 text-red-400" />
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Adiantamentos" name="advances" type="number" value={formData.advances} onChange={handleChange} />
                  <InputField label="Faltas (Dias)" name="absences" type="number" value={formData.absences} onChange={handleChange} step="1" />
                </div>
                <InputField label="Empréstimos" name="loans" type="number" value={formData.loans} onChange={handleChange} />
                
                <div className="pt-4 border-t border-gray-800 mt-2">
                  <p className="text-[10px] font-bold text-gray-600 uppercase mb-4 tracking-widest">Convênios e Outros</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InputField label="Farmácia" name="pharmacy" type="number" value={formData.pharmacy} onChange={handleChange} />
                    <InputField label="Supermercado" name="supermarket" type="number" value={formData.supermarket} onChange={handleChange} />
                    <InputField label="Odontológico" name="dental" type="number" value={formData.dental} onChange={handleChange} />
                    <InputField label="Médico" name="medical" type="number" value={formData.medical} onChange={handleChange} />
                    <InputField label="Outros Convenios" name="otherConvenios" type="number" value={formData.otherConvenios} onChange={handleChange} />
                    <InputField label="Descontos Diversos" name="otherDiscounts" type="number" value={formData.otherDiscounts} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollForm;
