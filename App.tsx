
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, UserPlus, FileText, Users, History, Menu, X, Wallet, Search, Eye, HandCoins, Layers, MapPin, FileDigit, Briefcase, DollarSign, User, Pencil, Save, RotateCcw, RefreshCw, LogOut } from 'lucide-react';
import { Employee, PayrollRecord, View } from './types';
import { supabase } from './supabaseClient';
import EmployeeRegistration from './components/EmployeeRegistration';
import PayrollForm from './components/PayrollForm';
import Dashboard from './components/Dashboard';
import AdvancesView from './components/AdvancesView';
import BatchPayrollView from './components/BatchPayrollView';
import Login from './components/Login';

// Helpers para conversão de data
const parseDateToDB = (dateStr: string) => {
  if (!dateStr || !dateStr.includes('/')) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const formatDateFromDB = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const formatCEPMask = (value: string) => {
  const v = value.replace(/\D/g, '').slice(0, 8);
  if (v.length <= 5) return v;
  return `${v.slice(0, 5)}-${v.slice(5)}`;
};

const DetailItem = ({ 
  label, 
  value, 
  icon, 
  name, 
  isEditing, 
  onChange,
  type = "text"
}: { 
  label: string, 
  value: string | number, 
  icon?: React.ReactNode, 
  name?: string, 
  isEditing?: boolean,
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
  type?: string
}) => (
  <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-400 transition-colors">
    <div className="flex items-center gap-2">
      {icon && <span className="text-gray-400">{icon}</span>}
      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
    {isEditing && name ? (
      name === 'company' ? (
        <select
          name={name}
          value={value}
          onChange={onChange as any}
          className="bg-white text-sm font-bold text-gray-900 border border-blue-500/30 rounded px-2 py-1 focus:outline-none focus:border-blue-500 w-full appearance-none"
        >
          <option value="">Selecione...</option>
          <option value="CAMPLUVAS">CAMPLUVAS</option>
          <option value="LOCATEX">LOCATEX</option>
        </select>
      ) : (
        <input 
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          step={type === 'number' ? '0.01' : undefined}
          className="bg-white text-sm font-bold text-gray-900 border border-blue-500/30 rounded px-2 py-1 focus:outline-none focus:border-blue-500 w-full"
        />
      )
    ) : (
      <span className="text-sm font-bold text-gray-900 truncate">
        {type === 'number' && typeof value === 'number' 
          ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
          : (value !== undefined && value !== null && value !== '' ? value : '---')}
      </span>
    )}
  </div>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('DASHBOARD');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employeeCompanyFilter, setEmployeeCompanyFilter] = useState<string>('');
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [editFormData, setEditFormData] = useState<Employee | null>(null);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          setSession(currentSession);
          if (currentSession) {
            await fetchInitialData();
          } else {
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error("Erro ao inicializar autenticação:", err);
        if (mounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        if (session) {
          fetchInitialData();
        } else {
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const { data: empData, error: empError } = await supabase.from('employees').select('*').order('name');
      if (empError) throw empError;
      
      const { data: payData, error: payError } = await supabase.from('payroll_records').select('*').order('created_at', { ascending: false });
      if (payError) throw payError;

      setEmployees((empData || []).map(mapDBToEmployee));
      setPayrollRecords((payData || []).map(mapDBToPayroll));
    } catch (error) {
      console.error('Erro ao buscar dados do banco:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mapEmployeeToDB = (emp: Omit<Employee, 'id'>) => ({
    name: emp.name,
    company: emp.company,
    admission_date: parseDateToDB(emp.admissionDate),
    dismissal_date: parseDateToDB(emp.dismissalDate),
    birth_date: parseDateToDB(emp.birthDate),
    address: emp.address,
    city: emp.city,
    state: emp.state,
    cep: emp.cep,
    phone: emp.phone,
    father_name: emp.fatherName,
    mother_name: emp.motherName,
    cpf: emp.cpf,
    rg: emp.rg,
    ctps: emp.ctps,
    pis: emp.pis,
    voter_id: emp.voterId,
    role: emp.role,
    salary: emp.salary,
    role_accumulation: emp.roleAccumulation
  });

  const mapDBToEmployee = (db: any): Employee => ({
    id: db.id,
    name: db.name,
    company: db.company,
    admissionDate: formatDateFromDB(db.admission_date),
    dismissalDate: formatDateFromDB(db.dismissal_date),
    birthDate: formatDateFromDB(db.birth_date),
    address: db.address,
    city: db.city,
    state: db.state,
    cep: db.cep,
    phone: db.phone,
    fatherName: db.father_name,
    motherName: db.mother_name,
    cpf: db.cpf,
    rg: db.rg,
    ctps: db.ctps,
    pis: db.pis,
    voterId: db.voter_id,
    role: db.role,
    salary: Number(db.salary || 0),
    roleAccumulation: Number(db.role_accumulation || 0)
  });

  const mapPayrollToDB = (record: Omit<PayrollRecord, 'id'>) => ({
    employee_id: record.employeeId,
    closing_date: parseDateToDB(record.closingDate),
    other_income: record.otherIncome,
    bonuses: record.bonuses,
    vt: record.vt,
    basic_basket: record.basicBasket,
    ot100: record.ot100,
    ot70: record.ot70,
    ot50: record.ot50,
    vr: record.vr,
    advances: record.advances,
    absences: record.absences,
    loans: record.loans,
    other_discounts: record.otherDiscounts,
    pharmacy: record.pharmacy,
    supermarket: record.supermarket,
    dental: record.dental,
    medical: record.medical,
    other_convenios: record.otherConvenios,
    observations: record.observations
  });

  const mapDBToPayroll = (db: any): PayrollRecord => ({
    id: db.id,
    employeeId: db.employee_id,
    closingDate: formatDateFromDB(db.closing_date),
    otherIncome: Number(db.other_income || 0),
    bonuses: Number(db.bonuses || 0),
    vt: db.vt || false,
    basicBasket: Number(db.basic_basket || 0),
    ot100: Number(db.ot100 || 0),
    ot70: Number(db.ot70 || 0),
    ot50: Number(db.ot50 || 0),
    vr: Number(db.vr || 0),
    advances: Number(db.advances || 0),
    absences: Number(db.absences || 0),
    loans: Number(db.loans || 0),
    otherDiscounts: Number(db.other_discounts || 0),
    pharmacy: Number(db.pharmacy || 0),
    supermarket: Number(db.supermarket || 0),
    dental: Number(db.dental || 0),
    medical: Number(db.medical || 0),
    otherConvenios: Number(db.other_convenios || 0),
    observations: db.observations || ""
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmployees([]);
    setPayrollRecords([]);
    setActiveView('DASHBOARD');
  };

  const handleAddEmployee = async (employee: Omit<Employee, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([mapEmployeeToDB(employee)])
        .select();
      
      if (error) throw error;

      if (data) {
        setEmployees(prev => [...prev, mapDBToEmployee(data[0])]);
        setActiveView('EMPLOYEE_LIST');
        alert("✅ Colaborador cadastrado!");
      }
    } catch (err: any) {
      alert(`❌ Erro: ${err.message}`);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!editFormData) return;
    try {
      const { error } = await supabase
        .from('employees')
        .update(mapEmployeeToDB(editFormData))
        .eq('id', editFormData.id);

      if (error) throw error;

      setEmployees(prev => prev.map(emp => emp.id === editFormData.id ? editFormData : emp));
      setSelectedEmployeeDetail(editFormData);
      setIsEditingEmployee(false);
      alert("✅ Atualizado!");
    } catch (err: any) {
      alert(`❌ Erro: ${err.message}`);
    }
  };

  const handleAddPayroll = async (record: Omit<PayrollRecord, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .insert([mapPayrollToDB(record)])
        .select();
      
      if (error) throw error;
      if (data) {
        setPayrollRecords(prev => [mapDBToPayroll(data[0]), ...prev]);
        setActiveView('PAYROLL_HISTORY');
      }
    } catch (err: any) {
      alert(`❌ Erro: ${err.message}`);
    }
  };

  const handleBatchSave = async (records: Omit<PayrollRecord, 'id'>[]) => {
    try {
      const dbRecords = records.map(mapPayrollToDB);
      const { data, error } = await supabase.from('payroll_records').insert(dbRecords).select();
      if (error) throw error;
      if (data) {
        setPayrollRecords(prev => [...data.map(mapDBToPayroll), ...prev]);
        setActiveView('PAYROLL_HISTORY');
        alert("✅ Lote salvo!");
      }
    } catch (err: any) {
      alert(`❌ Erro no lote: ${err.message}`);
    }
  };

  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (employeeSearchTerm) {
      const term = employeeSearchTerm.toLowerCase();
      result = result.filter(emp => emp.name.toLowerCase().includes(term));
    }
    if (employeeCompanyFilter) {
      result = result.filter(emp => emp.company === employeeCompanyFilter);
    }
    return result;
  }, [employees, employeeSearchTerm, employeeCompanyFilter]);

  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'EMPLOYEE_REGISTRATION', label: 'Cadastrar Funcionário', icon: <UserPlus size={20} /> },
    { id: 'PAYROLL', label: 'Lançar Folha Individual', icon: <FileText size={20} /> },
    { id: 'BATCH_PAYROLL', label: 'Fechamento Mensal', icon: <Layers size={20} /> },
    { id: 'ADVANCES', label: 'Adiantamentos', icon: <HandCoins size={20} /> },
    { id: 'EMPLOYEE_LIST', label: 'Funcionários', icon: <Users size={20} /> },
    { id: 'PAYROLL_HISTORY', label: 'Histórico', icon: <History size={20} /> },
  ];

  if (!session && !isLoading) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen flex bg-[#FFB100] text-gray-900">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 border-r border-gray-200 bg-white flex flex-col fixed h-full z-50 shadow-xl`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="bg-gray-900 p-2 rounded-lg"><Wallet className="text-[#FFB100]" size={24} /></div>
            <span className="font-black text-lg tracking-tight text-gray-900">RH Master</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-600">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id as View)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === item.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}>
              {item.icon}
              {isSidebarOpen && <span className="font-bold">{item.label}</span>}
            </button>
          ))}
        </nav>
        {isSidebarOpen && (
          <div className="p-6 border-t border-gray-100">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-black text-sm">
              <LogOut size={18} /> Sair
            </button>
          </div>
        )}
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 pt-40">
             <RefreshCw className="w-12 h-12 text-gray-900 animate-spin" />
             <p className="text-gray-900 font-black uppercase tracking-widest text-xs">Conectando...</p>
          </div>
        ) : (
          <div className="max-w-full mx-auto">
            {activeView === 'DASHBOARD' && <Dashboard employees={employees} payrollRecords={payrollRecords} setActiveView={setActiveView} />}
            {activeView === 'EMPLOYEE_REGISTRATION' && <EmployeeRegistration onSave={handleAddEmployee} />}
            {activeView === 'PAYROLL' && <PayrollForm employees={employees} onSave={handleAddPayroll} />}
            {activeView === 'BATCH_PAYROLL' && <BatchPayrollView employees={employees} payrollRecords={payrollRecords} onSaveBatch={handleBatchSave} />}
            {activeView === 'ADVANCES' && <AdvancesView employees={employees} />}
            {activeView === 'EMPLOYEE_LIST' && (
               <div className="space-y-6">
                 <header className="flex justify-between items-center">
                    <h1 className="text-3xl font-black text-gray-900">Colaboradores</h1>
                    <div className="flex gap-4">
                       <input 
                         type="text" 
                         placeholder="Buscar..."
                         value={employeeSearchTerm}
                         onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                         className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm"
                       />
                       <select
                         value={employeeCompanyFilter}
                         onChange={(e) => setEmployeeCompanyFilter(e.target.value)}
                         className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm"
                       >
                         <option value="">Todas</option>
                         <option value="CAMPLUVAS">CAMPLUVAS</option>
                         <option value="LOCATEX">LOCATEX</option>
                       </select>
                    </div>
                 </header>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map(emp => (
                      <div key={emp.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col justify-between shadow-lg">
                        <div>
                          <h3 className="font-black text-xl text-gray-900">{emp.name}</h3>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{emp.role}</p>
                        </div>
                        <button onClick={() => { setSelectedEmployeeDetail(emp); setEditFormData(emp); setIsEditingEmployee(false); }} className="mt-4 py-3 bg-gray-50 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-900 hover:text-white transition-all shadow-sm">
                          <Eye size={14} /> Detalhes
                        </button>
                      </div>
                    ))}
                 </div>
               </div>
            )}
            {activeView === 'PAYROLL_HISTORY' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-black text-gray-900">Histórico</h1>
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xl">
                   <table className="w-full text-left">
                     <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest">
                       <tr>
                         <th className="px-6 py-4">Empresa</th>
                         <th className="px-6 py-4">Funcionário</th>
                         <th className="px-6 py-4">Referência</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 text-sm">
                        {payrollRecords.map(record => {
                          const emp = employees.find(e => e.id === record.employeeId);
                          return (
                            <tr key={record.id}>
                              <td className="px-6 py-4 font-black">{emp?.company}</td>
                              <td className="px-6 py-4">{emp?.name}</td>
                              <td className="px-6 py-4 text-blue-600 font-bold">{record.closingDate}</td>
                            </tr>
                          );
                        })}
                     </tbody>
                   </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedEmployeeDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
          <div className="bg-white border border-gray-200 w-full max-w-5xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-3xl font-black text-gray-900">{isEditingEmployee ? 'Editando' : selectedEmployeeDetail.name}</h2>
              <div className="flex gap-3">
                <button onClick={() => { setSelectedEmployeeDetail(null); setIsEditingEmployee(false); }} className="p-3 hover:bg-red-50 text-gray-400 rounded-xl"><X size={24} /></button>
              </div>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-12">
               <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DetailItem label="Empresa" value={selectedEmployeeDetail.company} />
                  <DetailItem label="Cargo" value={selectedEmployeeDetail.role} />
                  <DetailItem label="Admissão" value={selectedEmployeeDetail.admissionDate} />
                  <DetailItem label="CPF" value={selectedEmployeeDetail.cpf} />
                  <DetailItem label="RG" value={selectedEmployeeDetail.rg} />
                  <DetailItem label="PIS" value={selectedEmployeeDetail.pis} />
               </section>
               <section className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200 grid grid-cols-2 gap-8">
                  <DetailItem label="Salário Base" value={selectedEmployeeDetail.salary} type="number" />
                  <DetailItem label="Acúmulo" value={selectedEmployeeDetail.roleAccumulation} type="number" />
               </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
