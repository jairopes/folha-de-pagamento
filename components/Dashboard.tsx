
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Employee, PayrollRecord, View } from '../types';
import { Users, CreditCard, Activity, TrendingUp, AlertCircle, FileDown } from 'lucide-react';

interface Props {
  employees: Employee[];
  payrollRecords: PayrollRecord[];
  setActiveView: (view: View) => void;
}

const Dashboard: React.FC<Props> = ({ employees, payrollRecords, setActiveView }) => {
  const totalSalaries = employees.reduce((acc, curr) => acc + curr.salary, 0);
  const activeEmployees = employees.length;
  
  // Calculate average salary
  const avgSalary = activeEmployees > 0 ? totalSalaries / activeEmployees : 0;

  // Mock data for chart - Salaries per employee (Top 5)
  const salaryData = employees
    .sort((a, b) => b.salary - a.salary)
    .slice(0, 5)
    .map(e => ({ name: e.name.split(' ')[0], salary: e.salary }));

  const COLORS = ['#1f2937', '#2563eb', '#16a34a', '#dc2626', '#7c3aed'];

  const exportEmployees = () => {
    if (employees.length === 0) return alert("Nenhum funcionário cadastrado.");
    
    const header = [
      "Nome Completo", "Cargo/Função", "Data Admissão", "Data Demissão", "Data Nascimento",
      "CPF", "RG", "PIS", "CTPS", "Título Eleitor", 
      "Telefone", "Endereço", "Cidade", "UF", "CEP",
      "Nome do Pai", "Nome da Mãe", "Salário Base", "Acúmulo de Função"
    ];

    const rows = employees.map(emp => [
      emp.name,
      emp.role,
      emp.admissionDate,
      emp.dismissalDate || "Ativo",
      emp.birthDate,
      emp.cpf,
      emp.rg,
      emp.pis,
      emp.ctps,
      emp.voterId,
      emp.phone,
      emp.address,
      emp.city,
      emp.state,
      emp.cep,
      emp.fatherName,
      emp.motherName,
      emp.salary,
      emp.roleAccumulation
    ].map(val => typeof val === 'number' ? val.toFixed(2).replace('.', ',') : val).join(';'));

    const csvContent = "\uFEFF" + [header.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `cadastro_funcionarios_dashboard_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const StatCard = ({ title, value, icon, colorClass, trend }: any) => (
    <div className="bg-white border border-gray-100 p-6 rounded-3xl hover:border-gray-900 transition-all group shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorClass}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-black">
            {trend}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm font-black uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black tracking-tight text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 text-gray-900">Visão Geral</h1>
          <p className="text-gray-800/60 font-medium">Bem-vindo ao centro de controle de RH.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportEmployees}
            className="bg-white hover:bg-gray-50 text-gray-900 font-black py-3 px-6 rounded-2xl transition-all border border-gray-200 flex items-center gap-2 shadow-sm"
          >
            <FileDown size={20} /> Exportar Cadastro
          </button>
          <button 
            onClick={() => setActiveView('PAYROLL')}
            className="bg-gray-900 hover:bg-black text-white font-black py-3 px-6 rounded-2xl transition-all shadow-xl"
          >
            Lançar Folha
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Colaboradores Ativos" 
          value={activeEmployees} 
          icon={<Users className="text-blue-600" size={24} />} 
          colorClass="bg-blue-50"
          trend="+12%"
        />
        <StatCard 
          title="Folha Salarial Base" 
          value={totalSalaries.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          icon={<CreditCard className="text-green-600" size={24} />} 
          colorClass="bg-green-50"
        />
        <StatCard 
          title="Salário Médio" 
          value={avgSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          icon={<Activity className="text-yellow-600" size={24} />} 
          colorClass="bg-yellow-50"
        />
        <StatCard 
          title="Produtividade RH" 
          value="98.5%" 
          icon={<TrendingUp className="text-purple-600" size={24} />} 
          colorClass="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-8 rounded-3xl shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900">Maiores Salários Base</h3>
            <div className="flex gap-2">
              <span className="w-3 h-3 bg-gray-900 rounded-full"></span>
              <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Top 5 Colaboradores</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salaryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  className="font-black uppercase"
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `R$${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="salary" radius={[10, 10, 0, 0]}>
                  {salaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Tasks */}
        <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-lg">
          <h3 className="text-xl font-black text-gray-900 mb-6">Próximos Fechamentos</h3>
          <div className="space-y-4">
            {employees.slice(0, 4).map((emp, i) => (
              <div key={emp.id} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-[#FFB100] font-black">
                  {emp.name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-black text-sm text-gray-900 truncate">{emp.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{emp.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-blue-600 font-black">FECHAMENTO</p>
                  <p className="text-xs text-gray-900 font-bold">Dia 05</p>
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <div className="py-10 text-center text-gray-400">
                <AlertCircle className="mx-auto mb-2 opacity-20" size={32} />
                <p className="text-sm">Sem pendências registradas.</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => setActiveView('EMPLOYEE_LIST')}
            className="w-full mt-6 py-3 border border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
          >
            Ver Todos Colaboradores
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
