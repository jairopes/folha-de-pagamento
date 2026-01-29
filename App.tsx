
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, UserPlus, FileText, Users, History, Menu, X, Wallet, Download, Search, Eye, ArrowRight, HandCoins, Layers, MapPin, Phone, FileDigit, Briefcase, DollarSign, User, FileDown, Building2, Filter, Pencil, Save, RotateCcw, RefreshCw, LogOut } from 'lucide-react';
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
  <div className="flex flex-col gap-1 p-3 bg-black/30 rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors">
    <div className="flex items-center gap-2">
      {icon && <span className="text-gray-600">{icon}</span>}
      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
    {isEditing && name ? (
      name === 'company' ? (
        <select
          name={name}
          value={value}
          onChange={onChange as any}
          className="bg-gray-900 text-sm font-bold text-white border border-blue-500/30 rounded px-2 py-1 focus:outline-none focus:border-blue-500 w-full appearance-none"
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
          className="bg-gray-900 text-sm font-bold text-white border border-blue-500/30 rounded px-2 py-1 focus:outline-none focus:border-blue-500 w-full"
        />
      )
    ) : (
      <span className="text-sm font-bold text-gray-200 truncate">
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
      
      if (error) {
        if (error.code === '23505') {
          alert("⚠️ Este CPF já está cadastrado no sistema.");
          return;
        }
        throw error;
      }

      if (data) {
        setEmployees(prev => [...prev, mapDBToEmployee(data[0])]);
        setActiveView('EMPLOYEE_LIST');
        alert("✅ Colaborador cadastrado com sucesso!");
      }
    } catch (err: any) {
      console.error(err);
      alert(`❌ Erro ao salvar: ${err.message || 'Verifique sua conexão.'}`);
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
      alert("✅ Cadastro atualizado!");
    } catch (err: any) {
      console.error(err);
      alert(`❌ Erro ao atualizar: ${err.message}`);
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
        alert("✅ Folha individual lançada!");
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
        alert("✅ Lote de folhas salvo com sucesso!");
      }
    } catch (err: any) {
      alert(`❌ Erro no lote: ${err.message}`);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue = value;
    if (name === 'cep') {
      processedValue = formatCEPMask(value);
    }

    setEditFormData(prev => prev ? {
      ...prev,
      [name]: type === 'number' ? parseFloat(processedValue) || 0 : processedValue
    } : null);
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
    { id: 'PAYROLL_HISTORY', label: 'Histórico de Pagamentos', icon: <History size={20} /> },
  ];

  if (!session && !isLoading) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] text-gray-100">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 border-r border-gray-800 bg-[#111] flex flex-col fixed h-full z-50`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-800">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="bg-blue-600 p-2 rounded-lg"><Wallet className="text-white" size={24} /></div>
            <span className="font-bold text-lg tracking-tight">RH Master</span>
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-800 rounded-md transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id as View)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}>
              {item.icon}
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        {isSidebarOpen && (
          <div className="p-6 border-t border-gray-800">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-900/10 transition-all font-bold text-sm">
              <LogOut size={18} /> Sair do Sistema
            </button>
          </div>
        )}
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 pt-40">
             <RefreshCw className="w-12 h-12 text-blue-500 animate-spin" />
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Conectando ao sistema...</p>
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
                    <h1 className="text-3xl font-black">Colaboradores</h1>
                    <div className="flex gap-4">
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                          <input 
                            type="text" 
                            placeholder="Buscar por nome..."
                            value={employeeSearchTerm}
                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                            className="bg-[#111] border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all"
                          />
                       </div>
                       <select
                         value={employeeCompanyFilter}
                         onChange={(e) => setEmployeeCompanyFilter(e.target.value)}
                         className="bg-[#111] border border-gray-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all"
                       >
                         <option value="">Todas Empresas</option>
                         <option value="CAMPLUVAS">CAMPLUVAS</option>
                         <option value="LOCATEX">LOCATEX</option>
                       </select>
                    </div>
                 </header>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map(emp => (
                      <div key={emp.id} className="bg-[#111] p-6 rounded-[2rem] border border-gray-800 flex flex-col justify-between hover:border-blue-500/50 transition-all group shadow-sm">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-black text-xl text-white group-hover:text-blue-400 transition-colors">{emp.name}</h3>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${emp.company === 'CAMPLUVAS' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
                              {emp.company}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{emp.role}</p>
                        </div>
                        <button onClick={() => { setSelectedEmployeeDetail(emp); setEditFormData(emp); setIsEditingEmployee(false); }} className="mt-4 py-3 bg-gray-900 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-inner">
                          <Eye size={14} /> Detalhes
                        </button>
                      </div>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
                        <p className="text-gray-600 font-bold uppercase tracking-widest">Nenhum colaborador encontrado.</p>
                      </div>
                    )}
                 </div>
               </div>
            )}
            {activeView === 'PAYROLL_HISTORY' && (
              <div className="space-y-6">
                <header className="flex justify-between items-center">
                  <h1 className="text-3xl font-black">Histórico</h1>
                </header>
                <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden">
                   <table className="w-full text-left">
                     <thead className="bg-gray-900/50 text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                       <tr>
                         <th className="px-6 py-4">Empresa</th>
                         <th className="px-6 py-4">Funcionário</th>
                         <th className="px-6 py-4">Referência</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-800 text-sm">
                        {payrollRecords.map(record => {
                          const emp = employees.find(e => e.id === record.employeeId);
                          return (
                            <tr key={record.id}>
                              <td className="px-6 py-4 font-bold">{emp?.company}</td>
                              <td className="px-6 py-4">{emp?.name}</td>
                              <td className="px-6 py-4 font-mono">{record.closingDate}</td>
                            </tr>
                          );
                        })}
                        {payrollRecords.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-10 text-center text-gray-600 italic">Sem registros históricos.</td>
                          </tr>
                        )}
                     </tbody>
                   </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedEmployeeDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#111] border border-gray-800 w-full max-w-5xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            {/* Header Modal */}
            <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gray-900/20">
              <div className="flex-1">
                <h2 className="text-3xl font-black truncate">{isEditingEmployee ? 'Editando Colaborador' : selectedEmployeeDetail.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    ID: {selectedEmployeeDetail.id.slice(0, 8)}...
                  </span>
                  <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                  <span className="text-xs text-blue-500 font-bold uppercase tracking-widest">
                    {selectedEmployeeDetail.company}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!isEditingEmployee ? (
                  <button 
                    onClick={() => setIsEditingEmployee(true)}
                    className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 font-bold text-xs uppercase"
                    title="Editar Cadastro"
                  >
                    <Pencil size={18} /> <span className="hidden md:inline">Editar</span>
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsEditingEmployee(false)}
                      className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 transition-all flex items-center gap-2 font-bold text-xs uppercase"
                      title="Cancelar"
                    >
                      <RotateCcw size={18} /> <span className="hidden md:inline">Cancelar</span>
                    </button>
                    <button 
                      onClick={handleUpdateEmployee}
                      className="p-3 bg-green-600 hover:bg-green-500 rounded-xl text-white transition-all shadow-lg shadow-green-900/20 flex items-center gap-2 font-bold text-xs uppercase"
                      title="Salvar Alterações"
                    >
                      <Save size={18} /> <span className="hidden md:inline">Salvar</span>
                    </button>
                  </>
                )}
                <div className="w-px h-8 bg-gray-800 mx-1"></div>
                <button 
                  onClick={() => { setSelectedEmployeeDetail(null); setIsEditingEmployee(false); }} 
                  className="p-3 hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content Modal */}
            <div className="p-8 overflow-y-auto flex-1 space-y-12">
               {/* Seção Contratual */}
               <section>
                 <div className="flex items-center gap-2 mb-6">
                   <Briefcase size={16} className="text-blue-500" />
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Dados do Contrato</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="company" label="Empresa" value={isEditingEmployee ? editFormData?.company || '' : selectedEmployeeDetail.company} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="role" label="Função / Cargo" value={isEditingEmployee ? editFormData?.role || '' : selectedEmployeeDetail.role} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="admissionDate" label="Data Admissão" value={isEditingEmployee ? editFormData?.admissionDate || '' : selectedEmployeeDetail.admissionDate} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="dismissalDate" label="Data Demissão" value={isEditingEmployee ? editFormData?.dismissalDate || '' : selectedEmployeeDetail.dismissalDate} />
                 </div>
               </section>

               {/* Seção Pessoal */}
               <section>
                 <div className="flex items-center gap-2 mb-6">
                   <User size={16} className="text-blue-500" />
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Informações Pessoais</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="name" label="Nome Completo" value={isEditingEmployee ? editFormData?.name || '' : selectedEmployeeDetail.name} />
                    </div>
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="birthDate" label="Nascimento" value={isEditingEmployee ? editFormData?.birthDate || '' : selectedEmployeeDetail.birthDate} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="fatherName" label="Nome do Pai" value={isEditingEmployee ? editFormData?.fatherName || '' : selectedEmployeeDetail.fatherName} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="motherName" label="Nome da Mãe" value={isEditingEmployee ? editFormData?.motherName || '' : selectedEmployeeDetail.motherName} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="phone" label="Telefone / Celular" value={isEditingEmployee ? editFormData?.phone || '' : selectedEmployeeDetail.phone} />
                 </div>
               </section>

               {/* Seção Endereço */}
               <section>
                 <div className="flex items-center gap-2 mb-6">
                   <MapPin size={16} className="text-blue-500" />
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Endereço Residencial</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="address" label="Logradouro" value={isEditingEmployee ? editFormData?.address || '' : selectedEmployeeDetail.address} />
                    </div>
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="cep" label="CEP" value={isEditingEmployee ? editFormData?.cep || '' : selectedEmployeeDetail.cep} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="city" label="Cidade" value={isEditingEmployee ? editFormData?.city || '' : selectedEmployeeDetail.city} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="state" label="UF" value={isEditingEmployee ? editFormData?.state || '' : selectedEmployeeDetail.state} />
                 </div>
               </section>

               {/* Seção Documentos */}
               <section>
                 <div className="flex items-center gap-2 mb-6">
                   <FileDigit size={16} className="text-blue-500" />
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Documentação</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="cpf" label="CPF" value={isEditingEmployee ? editFormData?.cpf || '' : selectedEmployeeDetail.cpf} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="rg" label="RG" value={isEditingEmployee ? editFormData?.rg || '' : selectedEmployeeDetail.rg} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="pis" label="PIS" value={isEditingEmployee ? editFormData?.pis || '' : selectedEmployeeDetail.pis} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="ctps" label="CTPS" value={isEditingEmployee ? editFormData?.ctps || '' : selectedEmployeeDetail.ctps} />
                    <DetailItem isEditing={isEditingEmployee} onChange={handleEditChange} name="voterId" label="Título Eleitor" value={isEditingEmployee ? editFormData?.voterId || '' : selectedEmployeeDetail.voterId} />
                 </div>
               </section>

               {/* Seção Financeira */}
               <section className="bg-blue-600/5 p-8 rounded-[2.5rem] border border-blue-500/10">
                 <div className="flex items-center gap-2 mb-6">
                   <DollarSign size={18} className="text-blue-400" />
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">Remuneração Base Mensal</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DetailItem 
                      isEditing={isEditingEmployee} 
                      onChange={handleEditChange} 
                      name="salary" 
                      label="Salário Mensal (R$)" 
                      type="number"
                      value={isEditingEmployee ? editFormData?.salary || 0 : selectedEmployeeDetail.salary} 
                    />
                    <DetailItem 
                      isEditing={isEditingEmployee} 
                      onChange={handleEditChange} 
                      name="roleAccumulation" 
                      label="Acúmulo de Função (R$)" 
                      type="number"
                      value={isEditingEmployee ? editFormData?.roleAccumulation || 0 : selectedEmployeeDetail.roleAccumulation} 
                    />
                 </div>
               </section>
            </div>
            
            {/* Footer Modal Info */}
            <div className="p-4 bg-gray-900/40 border-t border-gray-800 text-center">
               <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                 Alterações salariais e de cargo impactam novos fechamentos de folha.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
