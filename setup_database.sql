
-- 1. Criar a tabela de Funcionários (Employees)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    company TEXT NOT NULL CHECK (company IN ('CAMPLUVAS', 'LOCATEX')),
    admission_date DATE NOT NULL,
    dismissal_date DATE,
    birth_date DATE,
    address TEXT,
    city TEXT,
    state TEXT,
    cep TEXT,
    phone TEXT,
    father_name TEXT,
    mother_name TEXT,
    cpf TEXT UNIQUE NOT NULL,
    rg TEXT,
    ctps TEXT,
    pis TEXT,
    voter_id TEXT,
    role TEXT NOT NULL,
    salary NUMERIC(15, 2) DEFAULT 0.00,
    role_accumulation NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar a tabela de Registros de Folha (Payroll Records)
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    closing_date DATE NOT NULL,
    
    -- Proventos (Earnings)
    other_income NUMERIC(15, 2) DEFAULT 0.00,
    bonuses NUMERIC(15, 2) DEFAULT 0.00,
    vt BOOLEAN DEFAULT FALSE,
    basic_basket NUMERIC(15, 2) DEFAULT 0.00,
    ot100 NUMERIC(15, 2) DEFAULT 0.00,
    ot70 NUMERIC(15, 2) DEFAULT 0.00,
    ot50 NUMERIC(15, 2) DEFAULT 0.00,
    vr NUMERIC(15, 2) DEFAULT 0.00,
    
    -- Descontos (Deductions)
    advances NUMERIC(15, 2) DEFAULT 0.00,
    absences NUMERIC(15, 2) DEFAULT 0.00,
    loans NUMERIC(15, 2) DEFAULT 0.00,
    other_discounts NUMERIC(15, 2) DEFAULT 0.00,
    pharmacy NUMERIC(15, 2) DEFAULT 0.00,
    supermarket NUMERIC(15, 2) DEFAULT 0.00,
    dental NUMERIC(15, 2) DEFAULT 0.00,
    medical NUMERIC(15, 2) DEFAULT 0.00,
    other_convenios NUMERIC(15, 2) DEFAULT 0.00,
    
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Acesso (Apenas usuários autenticados)

-- Políticas para Employees
CREATE POLICY "Enable all for authenticated users" 
ON public.employees 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas para Payroll Records
CREATE POLICY "Enable all for authenticated users" 
ON public.payroll_records 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_employees_name ON public.employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_cpf ON public.employees(cpf);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON public.payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_closing_date ON public.payroll_records(closing_date);
