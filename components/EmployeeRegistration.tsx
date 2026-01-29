
import React, { useState } from 'react';
import { Save, User, MapPin, Phone, FileDigit, Briefcase, DollarSign, AlertCircle, Building2, Users } from 'lucide-react';
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
    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange as any}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      step={step}
      className={`bg-gray-50 text-gray-900 border ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:ring-gray-900/10 focus:border-gray-900'} rounded-xl px-4 py-3 focus:outline-none focus:ring-4 transition-all placeholder-gray-300 font-medium`}
    />
    {error && (
      <span className="text-[10px] text-red-600 font-black flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
        <AlertCircle size={10} /> {error}
      </span>
    )}
  </div>
);

const SectionTitle = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <div className="flex items-center gap-2 mb-6 pt-4 border-t border-gray-100 first:border-t-0 first:pt-0">
    <div className="p-2 bg-gray-50 rounded-lg text-gray-900">
      {icon}
    </div>
    <h2 className="text-xl font-black tracking-tight text-gray-900">{title}</h2>
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
    if (!formData.company) return alert("⚠️ Selecione a EMPRESA.");
    if (!formData.name.trim() || formData.name.length < 3) return alert("⚠️ Informe o NOME COMPLETO.");
    const rawCpf = formData.cpf.replace(/\D/g, '');
    if (rawCpf.length !== 11 || !isValidCPF(rawCpf)) return alert("⚠️ CPF INVÁLIDO.");
    if (!formData.role.trim()) return alert("⚠️ Informe o CARGO.");
    if (!formData.admissionDate || formData.admissionDate.length < 10) return alert("⚠️ Informe uma DATA DE ADMISSÃO válida.");

    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-black mb-2 text-gray-900">Cadastrar Colaborador</h1>
        <p className="text-gray-800/60 font-bold uppercase text-[10px] tracking-widest">Informações admissionais e pessoais</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-10">
        <section>
          <SectionTitle icon={<Building2 size={18} />} title="Dados do Contrato" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Empresa Contratante</label>
              <select
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-gray-900/10 appearance-none cursor-pointer font-medium"
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
            <InputField label="Registro Geral (RG)" name="rg" placeholder="00.000.000-0" value={formData.rg} onChange={handleChange} />
            <InputField label="Data de Nascimento" name="birthDate" placeholder="DD/MM/AAAA" value={formData.birthDate} onChange={handleChange} />
          </div>
        </section>

        <section>
          <SectionTitle icon={<Users size={18} />} title="Filiação" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Nome do Pai" name="fatherName" value={formData.fatherName} onChange={handleChange} />
            <InputField label="Nome da Mãe" name="motherName" value={formData.motherName} onChange={handleChange} />
          </div>
        </section>

        <section>
          <SectionTitle icon={<FileDigit size={18} />} title="Documentação Adicional" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField label="Número PIS" name="pis" placeholder="000.00000.00-0" value={formData.pis} onChange={handleChange} />
            <InputField label="Carteira de Trabalho (CTPS)" name="ctps" value={formData.ctps} onChange={handleChange} />
            <InputField label="Título de Eleitor" name="voterId" value={formData.voterId} onChange={handleChange} />
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

        <div className="pt-10 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            className="w-full md:w-auto bg-gray-900 hover:bg-black text-white font-black py-4 px-12 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 shadow-xl"
          >
            <Save size={20} className="text-[#FFB100]" />
            <span>Finalizar Cadastro</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeRegistration;
