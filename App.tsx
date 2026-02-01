
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, UserPlus, FileText, Users, History, Menu, X, Wallet, 
  Eye, HandCoins, Layers, RefreshCw, LogOut, Wifi, WifiOff, AlertTriangle 
} from 'lucide-react';
import { Employee, PayrollRecord, View } from './types';
import { supabase } from './supabaseClient';
import EmployeeRegistration from './components/EmployeeRegistration';
import PayrollForm from './components/PayrollForm';
import Dashboard from './components/Dashboard';
import AdvancesView from './components/AdvancesView';
import BatchPayrollView from './components/BatchPayrollView';
import Login from './components/Login';

// --- MOCK DATA PARA FALLBACK ---
const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Colaborador Exemplo (Local)', company: 'CAMPLUVAS', admissionDate: '01/01/2023', dismissalDate: '', birthDate: '01/01/1990', address: '', city: 'São Paulo', state: 'SP', cep: '00000-000', phone: '', fatherName: '', motherName: '', cpf: '000.000.000-00', rg: '', ctps: '', pis: '', voterId: '', role: 'Gerente', salary: 5000, roleAccumulation: 0 }
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('DASHBOARD');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employeeCompanyFilter, setEmployeeCompanyFilter] = useState<string>('');
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);

  // Helper para persistência local
  const saveLocal = (key: string, data: any) => localStorage.setItem(`rh_master_${key}`, JSON.stringify(data));
  const getLocal = (key: string) => {
    const data = localStorage.getItem(`rh_master_${key}`);
    return data ? JSON.parse(data) : null;
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          setSession(currentSession || { user: { email: 'demo@rh-master.local' } }); // Auto-login para demo se falhar silenciosamente
          await fetchInitialData();
        }
      } catch (err: any) {
        console.warn("Auth falhou, entrando em modo demo/local:", err.message);
        setIsOffline(true);
        if (mounted) {
          setSession({ user: { email: 'offline-user' } });
          loadLocalData();
        }
      }
    };

    initAuth();
  }, []);

  const loadLocalData = () => {
    setEmployees(getLocal('employees') || MOCK_EMPLOYEES);
    setPayrollRecords(getLocal('payroll') || []);
    setIsLoading(false);
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const { data: empData, error: empError } = await supabase.from('employees').select('*').order('name');
      if (empError) throw empError;
      
      const { data: payData, error: payError } = await supabase.from('payroll_records').select('*').order('created_at', { ascending: false });
      if (payError) throw payError;

      const mappedEmps = (empData || []).map(mapDBToEmployee);
      const mappedPay = (payData || []).map(mapDBToPayroll);

      setEmployees(mappedEmps);
      setPayrollRecords(mappedPay);
      saveLocal('employees', mappedEmps);
      saveLocal('payroll', mappedPay);
      setIsOffline(false);
    } catch (error: any) {
      console.error('Erro ao buscar do Supabase, carregando local:', error.message);
      setIsOffline(true);
      loadLocalData();
    } finally {
      setIsLoading(false);
    }
  };

  // Mapeadores
  const mapDBToEmployee = (db: any): Employee => ({
    id: db.id, name: db.name, company: db.company, admissionDate: db.admission_date,
    dismissalDate: db.dismissal_date, birthDate: db.birth_date, address: db.address,
    city: db.city, state: db.state, cep: db.cep, phone: db.phone, fatherName: db.father_name,
    motherName: db.mother_name, cpf: db.cpf, rg: db.rg, ctps: db.ctps, pis: db.pis,
    voterId: db.voter_id, role: db.role, salary: Number(db.salary || 0),
    roleAccumulation: Number(db.role_accumulation || 0)
  });

  const mapDBToPayroll = (db: any): PayrollRecord => ({
    id: db.id, employeeId: db.employee_id, closingDate: db.closing_date,
    otherIncome: Number(db.other_income || 0), bonuses: Number(db.bonuses || 0),
    vt: db.vt || false, basicBasket: Number(db.basic_basket || 0),
    ot100: Number(db.ot100 || 0), ot70: Number(db.ot70 || 0), ot50: Number(db.ot50 || 0),
    vr: Number(db.vr || 0), advances: Number(db.advances || 0), absences: Number(db.absences || 0),
    loans: Number(db.loans || 0), otherDiscounts: Number(db.other_discounts || 0),
    pharmacy: Number(db.pharmacy || 0), supermarket: Number(db.supermarket || 0),
    dental: Number(db.dental || 0), medical: Number(db.medical || 0),
    otherConvenios: Number(db.other_convenios || 0), observations: db.observations || ""
  });

  const handleAddEmployee = async (employee: Omit<Employee, 'id'>) => {
    const newEmp = { ...employee, id: crypto.randomUUID() } as Employee;
    const updated = [...employees, newEmp];
    setEmployees(updated);
    saveLocal('employees', updated);
    
    if (!isOffline) {
      try {
        await supabase.from('employees').insert([employee]);
      } catch (e) {
        console.warn("Falha ao sincronizar com nuvem, mantido localmente.");
      }
    }
    setActiveView('EMPLOYEE_LIST');
  };

  const handleAddPayroll = async (record: Omit<PayrollRecord, 'id'>) => {
    const newRecord = { ...record, id: crypto.randomUUID() } as PayrollRecord;
    const updated = [newRecord, ...payrollRecords];
    setPayrollRecords(updated);
    saveLocal('payroll', updated);
    setActiveView('PAYROLL_HISTORY');
  };

  const handleBatchSave = async (records: Omit<PayrollRecord, 'id'>[]) => {
    const newOnes = records.map(r => ({ ...r, id: crypto.randomUUID() } as PayrollRecord));
    const updated = [...newOnes, ...payrollRecords];
    setPayrollRecords(updated);
    saveLocal('payroll', updated);
    setActiveView('PAYROLL_HISTORY');
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
    { id: 'PAYROLL', label: 'Folha Individual', icon: <FileText size={20} /> },
    { id: 'BATCH_PAYROLL', label: 'Fechamento Mensal', icon: <Layers size={20} /> },
    { id: 'ADVANCES', label: 'Adiantamentos', icon: <HandCoins size={20} /> },
    { id: 'EMPLOYEE_LIST', label: 'Funcionários', icon: <Users size={20} /> },
    { id: 'PAYROLL_HISTORY', label: 'Histórico', icon: <History size={20} /> },
  ];

  if (!session && !isLoading) {
    return <Login onLoginSuccess={() => fetchInitialData()} />;
  }

  return (
    <div className="min-h-screen flex bg-[#FFB100] text-gray-900">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 border-r border-gray-200 bg-white flex flex-col fixed h-full z-50 shadow-xl`}>
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="bg-gray-900 p-2 rounded-lg"><Wallet className="text-[#FFB100]" size={24} /></div>
            <span className="font-black text-lg tracking-tight">RH Master</span>
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

        <div className="p-4 border-t border-gray-100">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${isOffline ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
            {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
            {isSidebarOpen && (isOffline ? 'Modo Local' : 'Nuvem Ativa')}
          </div>
        </div>

        {isSidebarOpen && (
          <div className="p-4">
            <button onClick={() => setSession(null)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all font-black text-sm">
              <LogOut size={18} /> Sair
            </button>
          </div>
        )}
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 pt-40">
             <RefreshCw className="w-12 h-12 text-gray-900 animate-spin" />
             <p className="text-gray-900 font-black uppercase tracking-widest text-xs">Sincronizando...</p>
          </div>
        ) : (
          <div className="max-w-full mx-auto">
            {isOffline && activeView === 'DASHBOARD' && (
              <div className="mb-6 bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3 text-orange-800 text-sm font-medium">
                <AlertTriangle className="text-orange-500" size={20} />
                O servidor está inacessível. Seus dados estão sendo salvos localmente neste navegador.
              </div>
            )}
            
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
                         type="text" placeholder="Buscar..." value={employeeSearchTerm}
                         onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                         className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-gray-900/5"
                       />
                    </div>
                 </header>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEmployees.map(emp => (
                      <div key={emp.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex flex-col justify-between shadow-lg hover:border-gray-900 transition-all cursor-default">
                        <div>
                          <h3 className="font-black text-xl text-gray-900">{emp.name}</h3>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{emp.role}</p>
                        </div>
                        <button onClick={() => setSelectedEmployeeDetail(emp)} className="mt-4 py-3 bg-gray-50 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-900 hover:text-white transition-all shadow-sm">
                          <Eye size={14} /> Detalhes
                        </button>
                      </div>
                    ))}
                 </div>
               </div>
            )}
            {activeView === 'PAYROLL_HISTORY' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-black text-gray-900">Histórico de Lançamentos</h1>
                <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-xl">
                   <table className="w-full text-left">
                     <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                       <tr>
                         <th className="px-8 py-5">Empresa</th>
                         <th className="px-8 py-5">Funcionário</th>
                         <th className="px-8 py-5">Referência</th>
                         <th className="px-8 py-5 text-right">Ações</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50 text-sm">
                        {payrollRecords.map(record => {
                          const emp = employees.find(e => e.id === record.employeeId);
                          return (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-8 py-4 font-black text-blue-600">{emp?.company || 'N/A'}</td>
                              <td className="px-8 py-4 font-bold">{emp?.name || '---'}</td>
                              <td className="px-8 py-4 font-mono">{record.closingDate}</td>
                              <td className="px-8 py-4 text-right">
                                <button className="text-gray-400 hover:text-gray-900 transition-colors"><Eye size={18} /></button>
                              </td>
                            </tr>
                          );
                        })}
                        {payrollRecords.length === 0 && (
                          <tr><td colSpan={4} className="px-8 py-10 text-center text-gray-400 italic">Nenhum registro encontrado.</td></tr>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-gray-200 w-full max-w-4xl rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-3xl font-black text-gray-900">{selectedEmployeeDetail.name}</h2>
              <button onClick={() => setSelectedEmployeeDetail(null)} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-10">
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Empresa</p>
                    <p className="font-bold">{selectedEmployeeDetail.company}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Cargo</p>
                    <p className="font-bold">{selectedEmployeeDetail.role}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Admissão</p>
                    <p className="font-bold">{selectedEmployeeDetail.admissionDate}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">CPF</p>
                    <p className="font-bold">{selectedEmployeeDetail.cpf}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Salário</p>
                    <p className="font-bold text-green-600">{selectedEmployeeDetail.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">PIS</p>
                    <p className="font-bold">{selectedEmployeeDetail.pis || '---'}</p>
                  </div>
               </div>
               <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl">
                  <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-4">Informações Residenciais</h4>
                  <p className="text-sm font-medium text-blue-800">{selectedEmployeeDetail.address || 'Endereço não cadastrado.'}</p>
                  <p className="text-sm font-medium text-blue-800">{selectedEmployeeDetail.city} - {selectedEmployeeDetail.state}</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
