
import React, { useState } from 'react';
import { Save, User, MapPin, Phone, FileDigit, Briefcase, DollarSign, AlertCircle, Building2 } from 'lucide-react';
import { Employee } from '../types';

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  step?: string;
  error?: string;
}

const InputField = ({ label, name, type = "text", placeholder = "", value, required = false, onChange, onBlur, step, error }: InputFieldProps) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange as any}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      step={step}
      className={`bg-black text-white border ${error ? 'border-red-500 focus:ring-red-500/50' : 'border-gray-800 focus:ring-blue-500/50 focus:border-blue-500'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all placeholder-gray-700`}
    />
    {error && (
      <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
        <AlertCircle size={10} /> {error}
      </span>
    )}
  </div>
);

const SectionTitle = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <div className="flex items-center gap-2 mb-6 pt-4 border-t border-gray-800 first:border-t-0 first:pt-0">
    <div className="p-2 bg-gray-900 rounded-lg text-blue-400">
      {icon}
    </div>
    <h2 className="text-xl font-bold tracking-tight">{title}</h2>
  </div>
);

interface Props {
  onSave: (employee: Omit<Employee, 'id'>) => void;
}

const EmployeeRegistration: React.FC<Props> = ({ onSave }) => {
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
    name: '',
    company: '',
    admissionDate: '',
    dismissalDate: '',
    birthDate: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    phone: '',
    fatherName: '',
    motherName: '',
    cpf: '',
    rg: '',
    ctps: '',
    pis: '',
    voterId: '',
    role: '',
    salary: 0,
    roleAccumulation: 0,
  });

  const [cpfError, setCpfError] = useState('');

  const isValidCPF = (cpf: string) => {
    const raw = cpf.replace(/[^\d]+/g, '');
    if (raw.length !== 11 || !!raw.match(/(\d)\1{10}/)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(raw.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(raw.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(raw.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(raw.charAt(10))) return false;
    return true;
  };

  const formatDateMask = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length <= 2) return v;
    if (v.length <= 4) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
  };

  const formatCPFMask = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 3) return v;
    if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`;
    if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
    return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
  };

  const formatCEPMask = (value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 8);
    if (v.length <= 5) return v;
    return `${v.slice(0, 5)}-${v.slice(5)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (['birthDate', 'admissionDate', 'dismissalDate'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: formatDateMask(value) }));
      return;
    }

    if (name === 'cpf') {
      const masked = formatCPFMask(value);
      setFormData(prev => ({ ...prev, [name]: masked }));
      const raw = masked.replace(/\D/g, '');
      if (raw.length === 11) {
        if (!isValidCPF(raw)) setCpfError('CPF inválido');
        else setCpfError('');
      } else {
        setCpfError('');
      }
      return;
    }

    if (name === 'cep') {
      setFormData(prev => ({ ...prev, [name]: formatCEPMask(value) }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company) {
      alert("⚠️ Selecione a EMPRESA do colaborador.");
      return;
    }
    if (!formData.name.trim() || formData.name.length < 3) {
      alert("⚠️ Informe o NOME COMPLETO corretamente.");
      return;
    }
    const rawCpf = formData.cpf.replace(/\D/g, '');
    if (rawCpf.length !== 11) {
      alert("⚠️ O CPF deve ter 11 dígitos.");
      return;
    }
    if (!isValidCPF(rawCpf)) {
      alert("⚠️ CPF INVÁLIDO. Por favor, confira os dígitos.");
      return;
    }
    if (!formData.role.trim()) {
      alert("⚠️ Informe o CARGO ou FUNÇÃO.");
      return;
    }
    if (!formData.admissionDate || formData.admissionDate.length < 10) {
      alert("⚠️ Informe uma DATA DE ADMISSÃO válida (DD/MM/AAAA).");
      return;
    }

    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-2 text-white">Cadastrar Colaborador</h1>
        <p className="text-gray-500 text-sm">Preencha todos os campos obrigatórios para registrar no sistema.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-[#111] border border-gray-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-10">
        <section>
          <SectionTitle icon={<Building2 size={18} />} title="Dados do Contrato" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Empresa Contratante</label>
              <select
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="bg-black text-white border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
              >
                <option value="">Selecione...</option>
                <option value="CAMPLUVAS">CAMPLUVAS</option>
                <option value="LOCATEX">LOCATEX</option>
              </select>
            </div>
            <InputField label="Data de Admissão" name="admissionDate" placeholder="DD/MM/AAAA" value={formData.admissionDate} onChange={handleChange} required />
            <div className="md:col-span-2">
              <InputField label="Função / Cargo" name="role" value={formData.role} onChange={handleChange} required />
            </div>
          </div>
        </section>

        <section>
          <SectionTitle icon={<User size={18} />} title="Identificação" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputField label="Nome Completo" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <InputField label="Número CPF" name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} error={cpfError} required />
            <InputField label="Data de Nascimento" name="birthDate" placeholder="DD/MM/AAAA" value={formData.birthDate} onChange={handleChange} />
          </div>
        </section>

        <section>
          <SectionTitle icon={<DollarSign size={18} />} title="Remuneração Mensal" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Salário Base (R$)" name="salary" type="number" step="0.01" value={formData.salary} onChange={handleChange} required />
            <InputField label="Acúmulo de Função (R$)" name="roleAccumulation" type="number" step="0.01" value={formData.roleAccumulation} onChange={handleChange} />
          </div>
        </section>

        <section>
          <SectionTitle icon={<MapPin size={18} />} title="Endereço e Contato" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <InputField label="Endereço" name="address" value={formData.address} onChange={handleChange} />
            </div>
            <InputField label="Telefone" name="phone" value={formData.phone} onChange={handleChange} />
            <InputField label="Cidade" name="city" value={formData.city} onChange={handleChange} />
            <InputField label="UF" name="state" value={formData.state} onChange={handleChange} />
            <InputField label="CEP" name="cep" placeholder="00000-000" value={formData.cep} onChange={handleChange} />
          </div>
        </section>

        <div className="pt-10 border-t border-gray-800 flex justify-end">
          <button
            type="submit"
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-12 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-900/30"
          >
            <Save size={20} className="text-white" />
            <span>Finalizar Cadastro</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeRegistration;
