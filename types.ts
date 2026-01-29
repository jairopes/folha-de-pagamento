
export interface Employee {
  id: string;
  name: string;
  company: 'CAMPLUVAS' | 'LOCATEX' | '';
  admissionDate: string;
  dismissalDate: string;
  birthDate: string;
  address: string;
  city: string;
  state: string;
  cep: string;
  phone: string;
  fatherName: string;
  motherName: string;
  cpf: string;
  rg: string;
  ctps: string;
  pis: string;
  voterId: string;
  role: string;
  salary: number;
  roleAccumulation: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  closingDate: string;
  // Earnings
  otherIncome: number;
  bonuses: number;
  vt: boolean;
  basicBasket: number;
  ot100: number;
  ot70: number;
  ot50: number;
  vr: number;
  // Deductions
  advances: number;
  absences: number;
  loans: number;
  otherDiscounts: number;
  pharmacy: number;
  supermarket: number;
  dental: number;
  medical: number;
  otherConvenios: number;
  // Notes
  observations: string;
}

export type View = 'LOGIN' | 'DASHBOARD' | 'EMPLOYEE_REGISTRATION' | 'PAYROLL' | 'BATCH_PAYROLL' | 'ADVANCES' | 'EMPLOYEE_LIST' | 'PAYROLL_HISTORY';
