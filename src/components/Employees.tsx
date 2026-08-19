import { apiFetch, safeResponseJson, fetchJson } from '../lib/api';
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UserPlus, 
  Users,
  ShieldCheck, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  XCircle, 
  Key, 
  Mail, 
  User, 
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  Award,
  TrendingUp,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  DollarSign,
  Activity,
  History,
  Filter,
  Search,
  Clock,
  Timer,
  CheckCircle2,
  UserCheck,
  Play,
  Square,
  LogOut,
  FileText,
  CalendarDays,
  Phone,
  MapPin,
  AlertCircle,
  Wallet,
  CreditCard,
  Receipt,
  Send,
  Printer,
  Share2,
  Plus,
  Check,
  Building,
  FileSpreadsheet
} from "lucide-react";
import { Employee, UserRole, Transaction, AttendanceRecord, SalesTarget, EmployeeLoan, LoanRepayment, PayrollRecord } from "../types";
import SignaturePad from "./SignaturePad";
import { useLanguage } from "../contexts/LanguageContext";

interface EmployeesProps {
  onEmployeesChange: () => void;
  currentUser: any;
  transactions?: Transaction[];
  onNavigateToContacts?: () => void;
}

export default function Employees({ onEmployeesChange, currentUser, transactions = [], onNavigateToContacts }: EmployeesProps) {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Staff Performance States
  const [performanceDate, setPerformanceDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [targetType, setTargetType] = useState<"COUNT" | "REVENUE">(() => {
    const saved = localStorage.getItem("fonepos_staff_target_type");
    return (saved as "COUNT" | "REVENUE") || "COUNT";
  });

  const [targetCount, setTargetCount] = useState<number>(() => {
    const saved = localStorage.getItem("fonepos_staff_target_count");
    return saved ? parseInt(saved, 10) : 5;
  });

  const [targetRevenue, setTargetRevenue] = useState<number>(() => {
    const saved = localStorage.getItem("fonepos_staff_target_revenue");
    return saved ? parseInt(saved, 10) : 5000000;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("fonepos_staff_target_type", targetType);
  }, [targetType]);

  useEffect(() => {
    localStorage.setItem("fonepos_staff_target_count", (targetCount ?? 0).toString());
  }, [targetCount]);

  useEffect(() => {
    localStorage.setItem("fonepos_staff_target_revenue", (targetRevenue ?? 0).toString());
  }, [targetRevenue]);
  
  // Monthly Staff Sales Target States
  const [salesTargets, setSalesTargets] = useState<SalesTarget[]>([]);
  const [selectedTargetMonth, setSelectedTargetMonth] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingTargets, setEditingTargets] = useState<Record<string, { amount: number; units: number; type: "AMOUNT" | "UNITS" | "BOTH"; notes: string }>>({});

  const fetchSalesTargets = async () => {
    try {
      const data = await fetchJson<SalesTarget[]>("/api/targets");
      if (Array.isArray(data)) {
        setSalesTargets(data);
      }
    } catch (err) {
      console.warn("Target sales belum dapat dimuat:", err);
    }
  };

  useEffect(() => {
    fetchSalesTargets();
  }, []);

  // --- KASBON & PINJAMAN KARYAWAN STATES ---
  const [employeeLoans, setEmployeeLoans] = useState<EmployeeLoan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanEmpId, setLoanEmpId] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanReason, setLoanReason] = useState("");
  const [loanNotes, setLoanNotes] = useState("");
  const [loanDate, setLoanDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  });
  const [loanSignature, setLoanSignature] = useState("");

  // Repayment States
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [repayLoan, setRepayLoan] = useState<EmployeeLoan | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayMethod, setRepayMethod] = useState<"CASH" | "TRANSFER" | "PAYROLL_DEDUCTION">("CASH");
  const [repayNotes, setRepayNotes] = useState("");
  const [repaySignature, setRepaySignature] = useState("");

  // Loan Digital Receipt Modal
  const [activeLoanReceipt, setActiveLoanReceipt] = useState<EmployeeLoan | null>(null);
  const [isLoanReceiptModalOpen, setIsLoanReceiptModalOpen] = useState(false);

  // --- PAYROLL / PENGGAJIAN STATES ---
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loadingPayrolls, setLoadingPayrolls] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [payEmpId, setPayEmpId] = useState("");
  const [payMonth, setPayMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  const [payDate, setPayDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  });
  const [payBasicSalary, setPayBasicSalary] = useState<string>("4000000");
  const [payAllowances, setPayAllowances] = useState<string>("500000");
  const [payBonuses, setPayBonuses] = useState<string>("0");
  const [payDeductions, setPayDeductions] = useState<string>("0");
  const [payLoanDeduction, setPayLoanDeduction] = useState<string>("0");
  const [payPaymentMethod, setPayPaymentMethod] = useState<"TRANSFER" | "CASH">("TRANSFER");
  const [payBankName, setPayBankName] = useState("BCA");
  const [payAccountNumber, setPayAccountNumber] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paySignature, setPaySignature] = useState("");

  // Active Slip Modal
  const [activeSlip, setActiveSlip] = useState<PayrollRecord | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.CASHIER);
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Status feedback
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await fetchJson<Employee[]>("/api/employees");
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (err) {
      console.error("Gagal memuat daftar karyawan:", err);
    } finally {
      setLoading(false);
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<"accounts" | "activities" | "attendance" | "payroll" | "loans">("accounts");

  const fetchEmployeeLoans = async () => {
    try {
      setLoadingLoans(true);
      const data = await fetchJson<EmployeeLoan[]>("/api/employee-loans");
      if (Array.isArray(data)) {
        setEmployeeLoans(data);
      }
    } catch (err) {
      console.error("Gagal memuat kasbon karyawan:", err);
    } finally {
      setLoadingLoans(false);
    }
  };

  const fetchPayrolls = async () => {
    try {
      setLoadingPayrolls(true);
      const data = await fetchJson<PayrollRecord[]>("/api/payrolls");
      if (Array.isArray(data)) {
        setPayrolls(data);
      }
    } catch (err) {
      console.error("Gagal memuat data penggajian:", err);
    } finally {
      setLoadingPayrolls(false);
    }
  };
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesSearch, setActivitiesSearch] = useState("");
  const [activitiesFilter, setActivitiesFilter] = useState("ALL");
  const [activitiesDateFilter, setActivitiesDateFilter] = useState("");

  // --- Clock In / Clock Out Attendance States ---
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [selectedEmpForClock, setSelectedEmpForClock] = useState<string>("");
  const [clockNotes, setClockNotes] = useState("");
  const [clockingAction, setClockingAction] = useState(false);
  const [clockStatusMsg, setClockStatusMsg] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceDateFilter, setAttendanceDateFilter] = useState<string>("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<string>("ALL");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Search & Pagination States for Employees Sub-Tabs
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [empPage, setEmpPage] = useState(1);
  const [empItemsPerPage, setEmpItemsPerPage] = useState(10);

  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceItemsPerPage, setAttendanceItemsPerPage] = useState(10);

  const [activityPage, setActivityPage] = useState(1);
  const [activityItemsPerPage, setActivityItemsPerPage] = useState(10);

  useEffect(() => { setEmpPage(1); }, [empSearchQuery]);
  useEffect(() => { setAttendancePage(1); }, [attendanceSearch, attendanceDateFilter, attendanceStatusFilter]);
  useEffect(() => { setActivityPage(1); }, [activitiesSearch, activitiesFilter, activitiesDateFilter]);

  const filteredEmployees = useMemo(() => {
    if (!empSearchQuery) return employees;
    const q = empSearchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        (e.role && e.role.toLowerCase().includes(q))
    );
  }, [employees, empSearchQuery]);

  const paginatedEmployees = useMemo(() => {
    const start = (empPage - 1) * empItemsPerPage;
    return filteredEmployees.slice(start, start + empItemsPerPage);
  }, [filteredEmployees, empPage, empItemsPerPage]);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync selected employee when employees list loads
  useEffect(() => {
    if (!selectedEmpForClock) {
      if (currentUser?.id) {
        setSelectedEmpForClock(currentUser.id);
      } else if (employees.length > 0) {
        setSelectedEmpForClock(employees[0].id);
      }
    }
  }, [employees, currentUser, selectedEmpForClock]);

  const fetchAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const res = await apiFetch("/api/attendance");
      const data = await res.json();
      setAttendanceRecords(data);
    } catch (err) {
      console.error("Gagal memuat data presensi:", err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);
      const res = await apiFetch("/api/employees/activities");
      if (res.ok) {
        const data = await res.json();
        setActivities(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Log aktivitas belum tersedia atau jaringan terputus:", err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  useEffect(() => {
    if (activeSubTab === "activities") {
      fetchActivities();
    } else if (activeSubTab === "attendance") {
      fetchAttendance();
    } else if (activeSubTab === "payroll") {
      fetchPayrolls();
      fetchEmployeeLoans();
    } else if (activeSubTab === "loans") {
      fetchEmployeeLoans();
    }
  }, [activeSubTab]);

  // Handle Clock In
  const handleClockIn = async () => {
    const emp = employees.find(e => e.id === selectedEmpForClock) || (employees.length > 0 ? employees[0] : null);
    const empId = emp?.id || currentUser?.id || "EMP001";
    const empName = emp?.name || currentUser?.name || "Karyawan";
    const empRole = emp?.role || currentUser?.role || "CASHIER";

    setClockingAction(true);
    setClockStatusMsg("");
    try {
      const res = await apiFetch("/api/attendance/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: empId,
          employeeName: empName,
          role: empRole,
          notes: clockNotes
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setClockStatusMsg(`⚠️ ${data.message || "Gagal Clock In"}`);
      } else {
        setClockNotes("");
        setClockStatusMsg(`✅ Clock In BERHASIL untuk ${empName} pada ${currentTime.toLocaleTimeString("id-ID")}`);
        fetchAttendance();
        onEmployeesChange();
      }
    } catch (err: any) {
      setClockStatusMsg(`⚠️ Terjadi kesalahan: ${err.message}`);
    } finally {
      setClockingAction(false);
    }
  };

  // Handle Clock Out
  const handleClockOut = async () => {
    const emp = employees.find(e => e.id === selectedEmpForClock) || (employees.length > 0 ? employees[0] : null);
    const empId = emp?.id || currentUser?.id || "EMP001";
    const empName = emp?.name || currentUser?.name || "Karyawan";

    setClockingAction(true);
    setClockStatusMsg("");
    try {
      const res = await apiFetch("/api/attendance/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: empId,
          notes: clockNotes
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setClockStatusMsg(`⚠️ ${data.message || "Gagal Clock Out"}`);
      } else {
        setClockNotes("");
        setClockStatusMsg(`✅ Clock Out BERHASIL untuk ${empName}. Durasi kerja: ${data.durationText || ""}`);
        fetchAttendance();
        onEmployeesChange();
      }
    } catch (err: any) {
      setClockStatusMsg(`⚠️ Terjadi kesalahan: ${err.message}`);
    } finally {
      setClockingAction(false);
    }
  };

  const handleDeleteAttendance = async (id: string, empName: string) => {
    if (!confirm(`Hapus catatan presensi untuk ${empName}?`)) return;
    try {
      await apiFetch(`/api/attendance/${id}`, { method: "DELETE" });
      fetchAttendance();
    } catch (err) {
      console.error("Gagal menghapus catatan presensi:", err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEmployee(null);
    setUsername("");
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setEmergencyContact("");
    setRole(UserRole.CASHIER);
    setPassword("");
    setIsActive(true);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setUsername(emp.username);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone || "");
    setAddress(emp.address || "");
    setEmergencyContact(emp.emergencyContact || "");
    setRole(emp.role);
    setPassword(""); // Do not populate password for security
    setIsActive(emp.isActive);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleOpenTargetModal = () => {
    const initialMap: Record<string, { amount: number; units: number; type: "AMOUNT" | "UNITS" | "BOTH"; notes: string }> = {};
    employees.forEach(emp => {
      const existing = salesTargets.find(t => t.userId === emp.id && t.month === selectedTargetMonth);
      initialMap[emp.id] = {
        amount: existing ? existing.targetAmount : 50000000,
        units: existing?.targetUnits ?? 50,
        type: existing?.targetType || "AMOUNT",
        notes: existing?.notes || ""
      };
    });
    setEditingTargets(initialMap);
    setIsTargetModalOpen(true);
  };

  const handleSaveTargets = async () => {
    try {
      const targetsPayload = Object.entries(editingTargets).map(([userId, val]) => {
        const targetVal = val as any;
        return {
          userId,
          month: selectedTargetMonth,
          targetType: targetVal?.type || "AMOUNT",
          targetAmount: Number(targetVal?.amount) || 0,
          targetUnits: Number(targetVal?.units) || 0,
          notes: targetVal?.notes || ""
        };
      });

      const res = await apiFetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets: targetsPayload })
      });

      if (res.ok) {
        await fetchSalesTargets();
        setIsTargetModalOpen(false);
        alert(`Target penjualan bulanan staf (${selectedTargetMonth}) berhasil disimpan!`);
      } else {
        alert("Gagal menyimpan target.");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan target.");
    }
  };

  // --- LOAN / KASBON HANDLERS ---
  const handleOpenCreateLoanModal = () => {
    setLoanEmpId(employees.length > 0 ? employees[0].id : "");
    setLoanAmount("");
    setLoanReason("");
    setLoanNotes("");
    const d = new Date();
    setLoanDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`);
    setLoanSignature("");
    setIsLoanModalOpen(true);
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === loanEmpId);
    if (!emp) {
      alert("Pilih karyawan penerima kasbon.");
      return;
    }
    const amt = Number(loanAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Masukkan nominal kasbon yang valid.");
      return;
    }

    try {
      const res = await apiFetch("/api/employee-loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: emp.id,
          employeeName: emp.name,
          amount: amt,
          reason: loanReason || "Pinjaman / Kasbon Operasional Karyawan",
          disbursedBy: currentUser?.name || "Admin",
          notes: loanNotes,
          digitalSignatureUrl: loanSignature,
          date: loanDate
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Pencairan kasbon karyawan berhasil disimpan!");
        setIsLoanModalOpen(false);
        fetchEmployeeLoans();
        if (data.loan) {
          setActiveLoanReceipt(data.loan);
          setIsLoanReceiptModalOpen(true);
        }
      } else {
        alert(data.message || "Gagal menyimpan data kasbon.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  const handleOpenRepayModal = (loan: EmployeeLoan) => {
    setRepayLoan(loan);
    setRepayAmount(loan.remainingAmount.toString());
    setRepayMethod("CASH");
    setRepayNotes("");
    setRepaySignature("");
    setIsRepayModalOpen(true);
  };

  const handleSaveRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoan) return;
    const amt = Number(repayAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("Nominal pembayaran cicilan tidak valid.");
      return;
    }

    try {
      const res = await apiFetch(`/api/employee-loans/${repayLoan.id}/repay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          paymentMethod: repayMethod,
          recordedBy: currentUser?.name || "Admin",
          notes: repayNotes,
          digitalSignatureUrl: repaySignature
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Pembayaran cicilan kasbon berhasil dicatat!");
        setIsRepayModalOpen(false);
        fetchEmployeeLoans();
        if (data.loan) {
          setActiveLoanReceipt(data.loan);
          setIsLoanReceiptModalOpen(true);
        }
      } else {
        alert(data.message || "Gagal mencatat pembayaran cicilan.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  // --- PAYROLL / GAJI HANDLERS ---
  const handleOpenCreatePayrollModal = () => {
    const defaultEmp = employees.length > 0 ? employees[0] : null;
    setPayEmpId(defaultEmp ? defaultEmp.id : "");
    const today = new Date();
    setPayMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`);
    const d = new Date();
    setPayDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`);
    setPayBasicSalary("4500000");
    setPayAllowances("500000");
    setPayBonuses("250000");
    setPayDeductions("0");
    setPayLoanDeduction("0");
    setPayPaymentMethod("TRANSFER");
    setPayBankName("BCA");
    setPayAccountNumber("8830192841");
    setPayNotes("");
    setPaySignature("");
    setIsPayrollModalOpen(true);
  };

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === payEmpId);
    if (!emp) {
      alert("Pilih karyawan penerima gaji.");
      return;
    }

    try {
      const res = await apiFetch("/api/payrolls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: emp.id,
          employeeName: emp.name,
          month: payMonth,
          paymentDate: payDate,
          basicSalary: Number(payBasicSalary) || 0,
          allowances: Number(payAllowances) || 0,
          bonuses: Number(payBonuses) || 0,
          deductions: Number(payDeductions) || 0,
          loanDeduction: Number(payLoanDeduction) || 0,
          paymentMethod: payPaymentMethod,
          bankName: payBankName,
          accountNumber: payAccountNumber,
          notes: payNotes,
          recordedBy: currentUser?.name || "Admin",
          digitalSignatureUrl: paySignature
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Proses penggajian dan slip gaji berhasil disimpan!");
        setIsPayrollModalOpen(false);
        fetchPayrolls();
        fetchEmployeeLoans();
        if (data.payroll) {
          setActiveSlip(data.payroll);
          setIsSlipModalOpen(true);
        }
      } else {
        alert(data.message || "Gagal menyimpan data penggajian.");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  const getWhatsAppLoanUrl = (loan: EmployeeLoan) => {
    const emp = employees.find(e => e.id === loan.employeeId);
    const rawPhone = emp?.phone || "";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
    
    const msg = `Halo ${loan.employeeName},\n\nBerikut Bukti Tanda Terima Digital Pencairan Kasbon Karyawan FonePOS:\n\n*No Voucher:* ${loan.id}\n*Tanggal & Waktu:* ${loan.date}\n*Nominal Kasbon:* Rp ${loan.amount.toLocaleString("id-ID")}\n*Sisa Utang:* Rp ${loan.remainingAmount.toLocaleString("id-ID")}\n*Keperluan:* ${loan.reason}\n*Status:* ${loan.status === "PAID_OFF" ? "LUNAS" : "AKTIF"}\n\n*Pencairan Oleh:* ${loan.disbursedBy}\nTerima kasih.`;
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;
  };

  const getWhatsAppPayrollUrl = (pay: PayrollRecord) => {
    const emp = employees.find(e => e.id === pay.employeeId);
    const rawPhone = emp?.phone || "";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;

    const msg = `Halo ${pay.employeeName},\n\nBerikut Slip Gaji Digital FonePOS Periode *${pay.month}*:\n\n*No Slip:* ${pay.id}\n*Tanggal Bayar:* ${pay.paymentDate}\n*Gaji Pokok:* Rp ${pay.basicSalary.toLocaleString("id-ID")}\n*Tunjangan:* Rp ${pay.allowances.toLocaleString("id-ID")}\n*Bonus Target Sales:* Rp ${pay.bonuses.toLocaleString("id-ID")}\n*Potongan Kasbon:* Rp ${pay.loanDeduction.toLocaleString("id-ID")}\n-------------------------------\n*GAJI BERSIH (TAKE HOME PAY):* *Rp ${pay.netSalary.toLocaleString("id-ID")}*\n*Metode Pembayaran:* ${pay.paymentMethod} (${pay.bankName || "Cash"} ${pay.accountNumber || ""})\n\nTerima kasih atas dedikasi dan kerja keras Anda!`;
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !name.trim() || !email.trim()) {
      setError("Semua field wajib diisi kecuali kata sandi saat memperbarui.");
      return;
    }

    const payload: any = {
      username,
      name,
      role,
      email,
      phone,
      address,
      emergencyContact,
      isActive
    };

    if (password.trim()) {
      payload.password = password;
    }

    const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees";
    const method = editingEmployee ? "PUT" : "POST";

    const userHeaders: Record<string, string> = currentUser ? {
      "X-User-Id": currentUser.id,
      "X-User-Name": encodeURIComponent(currentUser.name),
      "X-User-Role": currentUser.role
    } : {};

    try {
      setLoading(true);
      const res = await apiFetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          ...userHeaders
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(editingEmployee ? "Akun karyawan berhasil diperbarui!" : "Akun karyawan baru berhasil dibuat!");
        setIsModalOpen(false);
        fetchEmployees();
        onEmployeesChange();
      } else {
        setError(data.message || "Gagal menyimpan akun.");
      }
    } catch (err) {
      setError("Koneksi server gagal.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === "EMP001") {
      alert("Akun Super Admin utama tidak dapat dihapus!");
      return;
    }
    
    if (id === currentUser?.id) {
      alert("Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk.");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus akun karyawan ini secara permanen? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    const userHeaders: Record<string, string> = currentUser ? {
      "X-User-Id": currentUser.id,
      "X-User-Name": encodeURIComponent(currentUser.name),
      "X-User-Role": currentUser.role
    } : {};

    try {
      setLoading(true);
      const res = await apiFetch(`/api/employees/${id}`, { 
        method: "DELETE",
        headers: userHeaders
      });
      const data = await res.json();
      if (res.ok) {
        fetchEmployees();
        onEmployeesChange();
        alert("Karyawan berhasil dihapus.");
      } else {
        alert(data.message || "Gagal menghapus karyawan.");
      }
    } catch (err) {
      alert("Koneksi server gagal.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeStatus = async (emp: Employee) => {
    if (emp.id === "EMP001") {
      alert("Status akun Super Admin utama harus selalu aktif.");
      return;
    }
    
    if (emp.id === currentUser?.id) {
      alert("Anda tidak dapat menonaktifkan akun Anda sendiri saat sedang aktif.");
      return;
    }

    const userHeaders: Record<string, string> = currentUser ? {
      "X-User-Id": currentUser.id,
      "X-User-Name": encodeURIComponent(currentUser.name),
      "X-User-Role": currentUser.role
    } : {};

    try {
      setLoading(true);
      const res = await apiFetch(`/api/employees/${emp.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...userHeaders
        },
        body: JSON.stringify({ isActive: !emp.isActive })
      });
      if (res.ok) {
        fetchEmployees();
        onEmployeesChange();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STAFF PERFORMANCE CALCULATIONS
  // -------------------------------------------------------------
  const performanceTargetDateObj = new Date(performanceDate);

  // Helper to compare dates safely
  const isSameDay = (dateStr: string, targetDate: Date) => {
    try {
      const d = new Date(dateStr);
      return d.getFullYear() === targetDate.getFullYear() &&
             d.getMonth() === targetDate.getMonth() &&
             d.getDate() === targetDate.getDate();
    } catch {
      return false;
    }
  };

  // Get active paid transactions for selected day
  const dailyPaidTransactions = transactions.filter(t => 
    t.paymentStatus === "PAID" && isSameDay(t.date, performanceTargetDateObj)
  );

  // Calculate stats for each employee
  const staffPerformanceList = employees.map(emp => {
    const empTransactions = dailyPaidTransactions.filter(t => t.cashierId === emp.id);
    const totalTxCount = empTransactions.length;
    const totalTxRevenue = empTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

    const actualValue = targetType === "COUNT" ? totalTxCount : totalTxRevenue;
    const targetValue = targetType === "COUNT" ? targetCount : targetRevenue;
    const percent = targetValue > 0 ? Math.min(Math.round((actualValue / targetValue) * 100), 100) : 0;

    return {
      employee: emp,
      txCount: totalTxCount,
      revenue: totalTxRevenue,
      actual: actualValue,
      target: targetValue,
      percentage: percent,
      isTargetAchieved: actualValue >= targetValue && targetValue > 0
    };
  });

  // Calculate day summary
  const totalDailyTransactionsCount = dailyPaidTransactions.length;
  const totalDailyRevenue = dailyPaidTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

  // Find top performer for the day
  let topPerformer: any = null;
  let maxPerformanceVal = 0;

  staffPerformanceList.forEach(item => {
    if (item.actual > maxPerformanceVal) {
      maxPerformanceVal = item.actual;
      topPerformer = item;
    }
  });

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(performanceDate);
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setPerformanceDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const d = new Date(performanceDate);
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setPerformanceDate(`${year}-${month}-${day}`);
  };

  const handleSetToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setPerformanceDate(`${year}-${month}-${day}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-md font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5.5 w-5.5 text-primary-600 animate-pulse" />
            Manajemen Karyawan & Kinerja RBAC
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola kredensial login, peran otentikasi, dan status pembatasan hak akses karyawan toko secara terpusat.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap self-start">
          {onNavigateToContacts && (
            <button
              onClick={onNavigateToContacts}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/10 transition-all"
            >
              <Users className="h-4 w-4" />
              Buka Direktori Kontak (Supplier, Konsumen & Karyawan)
            </button>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary-600/10 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Akun Karyawan
          </button>
        </div>
      </div>

      {/* WIDGET KINERJA STAF (STAFF PERFORMANCE WIDGET) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                Pencapaian & Kinerja Harian Staf (Staff Performance)
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                Pantau jumlah transaksi sukses dan omzet penjualan per staf secara real-time berdasarkan target harian.
              </p>
            </div>
          </div>

          {/* Date Selector controls */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              onClick={handlePrevDay}
              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <Calendar className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
              <input
                type="date"
                value={performanceDate}
                onChange={(e) => setPerformanceDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={handleNextDay}
              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              title="Hari Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={handleSetToday}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-all"
            >
              Hari Ini
            </button>
          </div>
        </div>

        {/* Dynamic target settings panel */}
        <div className="bg-slate-50/70 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-slate-500" /> Pengaturan Target Harian:
            </span>
            <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl gap-0.5 border border-slate-300/40 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setTargetType("COUNT")}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${targetType === "COUNT" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                Jumlah Transaksi
              </button>
              <button
                type="button"
                onClick={() => setTargetType("REVENUE")}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${targetType === "REVENUE" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                Total Omzet (Rp)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Nilai Target:</span>
            {targetType === "COUNT" ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 font-bold">transaksi/hari</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="text"
                  value={targetRevenue || targetRevenue === 0 || targetRevenue === "0" ? Number(targetRevenue).toLocaleString("id-ID") : ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setTargetRevenue(val ? parseInt(val, 10) : 0);
                  }}
                  className="w-28 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 font-bold">omzet/hari</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Performance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Staff list - 8 cols */}
          <div className="lg:col-span-8 space-y-4">
            {staffPerformanceList.map(({ employee, txCount, revenue, actual, target, percentage, isTargetAchieved }) => {
              const isTop = topPerformer && topPerformer.employee.id === employee.id && actual > 0;
              return (
                <div 
                  key={employee.id} 
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isTop 
                      ? "bg-indigo-50/30 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/40" 
                      : isTargetAchieved 
                        ? "bg-emerald-50/10 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/20" 
                        : "bg-white dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/60"
                  }`}
                >
                  {/* Identity */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className="relative">
                      <div className={`h-11 w-11 rounded-xl border flex items-center justify-center font-extrabold text-sm uppercase ${
                        isTop 
                          ? "bg-indigo-600 text-white border-indigo-500" 
                          : "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      }`}>
                        {employee.name.charAt(0)}
                      </div>
                      {isTop && (
                        <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-0.5 rounded-full border border-white shadow-xs">
                          <Award className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">{employee.name}</p>
                        {isTop && (
                          <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-extrabold uppercase rounded">
                            Bintang Hari Ini 🌟
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{employee.role}</p>
                    </div>
                  </div>

                  {/* Mid stats: progress bar & achievements */}
                  <div className="flex-1 w-full max-w-sm">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      <span>Progres: {percentage}%</span>
                      <span>Target: {targetType === "COUNT" ? `${target} Transaksi` : `Rp ${(target ?? 0).toLocaleString()}`}</span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTop 
                            ? "bg-gradient-to-r from-indigo-500 to-indigo-600" 
                            : isTargetAchieved 
                              ? "bg-gradient-to-r from-emerald-400 to-emerald-500" 
                              : "bg-gradient-to-r from-amber-400 to-amber-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
                      <span>Aktual: {targetType === "COUNT" ? `${actual} Transaksi` : `Rp ${(actual ?? 0).toLocaleString()}`}</span>
                      {isTargetAchieved ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Target Terpenuhi! ✓</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-500 font-bold">Kurang {targetType === "COUNT" ? `${target - actual}` : `Rp ${((target ?? 0) - (actual ?? 0)).toLocaleString()}`}</span>
                      )}
                    </div>
                  </div>

                  {/* Right numbers display */}
                  <div className="flex items-center gap-4 text-right self-end md:self-center">
                    <div className="border-l border-slate-100 dark:border-slate-800 pl-4">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Transaksi</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300">{txCount} Transaksi</p>
                    </div>
                    <div className="border-l border-slate-100 dark:border-slate-800 pl-4 min-w-[100px]">
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Omzet</p>
                      <p className="text-xs font-black text-indigo-600 dark:text-indigo-400">Rp {(revenue ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {staffPerformanceList.length === 0 && (
              <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                <p className="text-xs text-slate-400 italic">Belum ada data karyawan terdaftar.</p>
              </div>
            )}
          </div>

          {/* Day summary panel - 4 cols */}
          <div className="lg:col-span-4 space-y-4">
            {/* Top Employee Honor Card */}
            {topPerformer ? (
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800 shadow-md relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 opacity-10">
                  <Award className="h-32 w-32" />
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-bold text-[9px] uppercase tracking-widest mb-3">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" /> Staf Terbaik Hari Ini
                </div>
                <h4 className="text-md font-black tracking-tight text-white mb-1">
                  {topPerformer.employee.name}
                </h4>
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mb-4">
                  {topPerformer.employee.role}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-800/70">
                  <div>
                    <span className="text-[9px] text-indigo-300 font-bold uppercase">Transaksi Sukses</span>
                    <p className="text-sm font-black text-white">{topPerformer.txCount} penjualan</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-indigo-300 font-bold uppercase">Omzet Harian</span>
                    <p className="text-sm font-black text-amber-400">Rp {(topPerformer.revenue ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-center py-8">
                <Award className="h-8 w-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Belum Ada Staf Penjual Hari Ini</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Staf terbaik akan terpilih otomatis berdasarkan pencapaian transaksi.</p>
              </div>
            )}

            {/* General Day Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200/50 dark:border-slate-800 pb-2">
                <Activity className="h-3.5 w-3.5" /> Ringkasan Toko ({new Date(performanceDate).toLocaleDateString("id-ID", { day: "numeric", month: "long" })})
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Transaksi Toko</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{totalDailyTransactionsCount} Transaksi</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Omzet Toko</span>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">Rp {(totalDailyRevenue ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rata-rata Penjualan/Staf</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Rp {employees.length > 0 ? Math.round((totalDailyRevenue || 0) / employees.length).toLocaleString() : "0"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WIDGET TARGET PENJUALAN BULANAN STAF (MONTHLY SALES TARGETS) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-800/80 shadow-xl rounded-2xl p-6 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-500/20 text-primary-300 rounded-2xl border border-primary-500/30">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                Target Omzet Bulanan Per Sales / Staf
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold uppercase rounded-md">
                  Real-time KPI
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Kelola target bulanan individual (contoh: Sales A target Rp 100jt/bulan) & pantau persentase pencapaian.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/80 border border-indigo-700/60 px-3.5 py-1.5 rounded-xl">
              <Calendar className="h-4 w-4 text-primary-400" />
              <label className="text-[10px] font-extrabold text-indigo-200 uppercase">Bulan Target:</label>
              <input
                type="month"
                value={selectedTargetMonth}
                onChange={(e) => setSelectedTargetMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleOpenTargetModal}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-primary-500/20 transition-all border border-primary-400/30"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Atur Target Sales Bulanan
            </button>
          </div>
        </div>

        {/* Target Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          {employees.map((emp) => {
            const targetObj = salesTargets.find(t => t.userId === emp.id && t.month === selectedTargetMonth);
            const targetTypeMode = targetObj?.targetType || "AMOUNT";
            const targetAmount = targetObj ? targetObj.targetAmount : 50000000;
            const targetUnits = targetObj?.targetUnits ?? 50;

            const monthlyPaidTx = transactions.filter(t => {
              if (t.cashierId !== emp.id || t.paymentStatus !== "PAID") return false;
              const txDate = new Date(t.date);
              const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
              return txMonth === selectedTargetMonth;
            });

            const actualOmzet = monthlyPaidTx.reduce((sum, t) => sum + t.totalAmount, 0);
            const actualUnits = monthlyPaidTx.reduce((sum, t) => sum + (t.items ? t.items.reduce((acc, i) => acc + ((i as any).quantity || 1), 0) : 1), 0);

            let mainPercent = 0;
            let isTargetReached = false;
            let targetLabel = "";

            if (targetTypeMode === "UNITS") {
              mainPercent = targetUnits > 0 ? Math.min(Math.round((actualUnits / targetUnits) * 100), 100) : 0;
              isTargetReached = actualUnits >= targetUnits && targetUnits > 0;
              targetLabel = `${targetUnits} Unit HP / Bulan`;
            } else if (targetTypeMode === "BOTH") {
              const pUnits = targetUnits > 0 ? (actualUnits / targetUnits) : 0;
              const pOmzet = targetAmount > 0 ? (actualOmzet / targetAmount) : 0;
              mainPercent = Math.min(Math.round(((pUnits + pOmzet) / 2) * 100), 100);
              isTargetReached = actualUnits >= targetUnits && actualOmzet >= targetAmount;
              targetLabel = `${targetUnits} Unit & Rp ${(targetAmount / 1000000).toFixed(0)}Jt`;
            } else {
              // AMOUNT
              mainPercent = targetAmount > 0 ? Math.min(Math.round((actualOmzet / targetAmount) * 100), 100) : 0;
              isTargetReached = actualOmzet >= targetAmount && targetAmount > 0;
              targetLabel = `Rp ${targetAmount.toLocaleString("id-ID")} / Bulan`;
            }

            return (
              <div 
                key={emp.id} 
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  isTargetReached 
                    ? "bg-gradient-to-b from-emerald-950/60 to-slate-950/80 border-emerald-500/50 shadow-lg shadow-emerald-500/10" 
                    : "bg-slate-950/60 border-indigo-900/60 hover:border-indigo-700/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-900/60 border border-indigo-700/60 flex items-center justify-center font-black text-sm uppercase text-primary-300">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">{emp.name}</h4>
                      <p className="text-[10px] text-indigo-300 font-semibold">{emp.role} • {emp.username}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    isTargetReached 
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                      : mainPercent >= 50 
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" 
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}>
                    {isTargetReached ? "🎉 Target Lolos" : mainPercent >= 50 ? "⚡ Progres 50%+" : "🎯 Berlangsung"}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-indigo-900/40">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[9px] text-indigo-300/80 font-bold uppercase">
                        {targetTypeMode === "UNITS" ? "Realisasi Unit HP" : targetTypeMode === "BOTH" ? "Realisasi Dual Target" : "Realisasi Omzet"}
                      </span>
                      <p className="text-sm font-black text-emerald-400">
                        {targetTypeMode === "UNITS" ? `${actualUnits} Unit Sold` : `Rp ${actualOmzet.toLocaleString("id-ID")}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-indigo-300/80 font-bold uppercase">Jenis Target</span>
                      <p className="text-xs font-bold text-slate-300">{targetLabel}</p>
                    </div>
                  </div>

                  <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-indigo-950">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTargetReached 
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-400" 
                          : mainPercent >= 50 
                            ? "bg-gradient-to-r from-primary-500 to-indigo-400" 
                            : "bg-gradient-to-r from-amber-500 to-amber-400"
                      }`}
                      style={{ width: `${mainPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-semibold text-indigo-200/80">
                    <span>Pencapaian: <b className="text-white">{mainPercent}%</b></span>
                    <span>
                      {isTargetReached 
                        ? "✅ Lolos Target!" 
                        : targetTypeMode === "UNITS" 
                          ? `Sisa: ${Math.max(0, targetUnits - actualUnits)} Unit` 
                          : `Sisa: Rp ${Math.max(0, targetAmount - actualOmzet).toLocaleString("id-ID")}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-900/40 text-[10px]">
                  <div className="bg-indigo-950/40 p-2 rounded-xl border border-indigo-900/40">
                    <span className="text-indigo-300 font-medium block">Total Unit HP:</span>
                    <span className="font-bold text-white">{actualUnits} / {targetUnits} Unit</span>
                  </div>
                  <div className="bg-indigo-950/40 p-2 rounded-xl border border-indigo-900/40">
                    <span className="text-indigo-300 font-medium block">Total Omzet:</span>
                    <span className="font-bold text-white">Rp {actualOmzet.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Control: Accounts vs Attendance vs Payroll vs Loans vs Activities */}
      <div className="flex border-b border-slate-200/80 dark:border-slate-800 gap-2 relative overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("accounts")}
          className={`relative pb-3 px-5 text-xs font-extrabold tracking-tight cursor-pointer transition-all whitespace-nowrap ${
            activeSubTab === "accounts" 
              ? "text-primary-600" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t("Daftar Akun Karyawan & Matriks RBAC")}
          {activeSubTab === "accounts" && (
            <motion.div
              layoutId="activeSubTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("attendance")}
          className={`relative pb-3 px-5 text-xs font-extrabold tracking-tight cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === "attendance" 
              ? "text-primary-600" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>{t("Presensi & Jam Kerja")}</span>
          {attendanceRecords.some(r => r.status === "CLOCKED_IN") && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          {activeSubTab === "attendance" && (
            <motion.div
              layoutId="activeSubTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("payroll")}
          className={`relative pb-3 px-5 text-xs font-extrabold tracking-tight cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === "payroll" 
              ? "text-primary-600" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>{t("Penggajian & Slip Gaji Digital")}</span>
          {activeSubTab === "payroll" && (
            <motion.div
              layoutId="activeSubTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("loans")}
          className={`relative pb-3 px-5 text-xs font-extrabold tracking-tight cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === "loans" 
              ? "text-primary-600" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          <span>{t("Kasbon & Pinjaman Karyawan")}</span>
          {employeeLoans.some(l => l.status === "ACTIVE") && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-bold">
              {employeeLoans.filter(l => l.status === "ACTIVE").length}
            </span>
          )}
          {activeSubTab === "loans" && (
            <motion.div
              layoutId="activeSubTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("activities")}
          className={`relative pb-3 px-5 text-xs font-extrabold tracking-tight cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === "activities" 
              ? "text-primary-600" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>{t("Log Audit & Aktivitas Karyawan")}</span>
          {activeSubTab === "activities" && (
            <motion.div
              layoutId="activeSubTabUnderline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeSubTab === "accounts" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Table list - Left Column (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-slate-200/80 shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Daftar Akun Pengguna Aktif ({filteredEmployees.length})
                    </span>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-56">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari nama, email, role..."
                          value={empSearchQuery}
                          onChange={(e) => setEmpSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <button 
                        onClick={fetchEmployees}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer shrink-0"
                        title="Refresh Data"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                          <th className="p-4">Identitas Karyawan</th>
                          <th className="p-4">Username</th>
                          <th className="p-4">Peran Hak Akses</th>
                          <th className="p-4 text-center">Status Keamanan</th>
                          <th className="p-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedEmployees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-50/40">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center font-bold text-primary-600 text-xs uppercase shadow-xs">
                                  {emp.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-800">{emp.name}</p>
                                  <p className="text-slate-400 font-medium text-[10px] mt-0.5 flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> {emp.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-600">{emp.username}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border ${
                                emp.role === UserRole.ADMIN 
                                  ? "bg-primary-50 text-primary-700 border-primary-200/50" 
                                  : emp.role === UserRole.MANAGER 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" 
                                    : "bg-amber-50 text-amber-700 border-amber-200/50"
                              }`}>
                                {emp.role}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => toggleEmployeeStatus(emp)}
                                disabled={emp.id === "EMP001" || emp.id === currentUser?.id}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                                  emp.isActive 
                                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 cursor-pointer" 
                                    : "bg-red-50 hover:bg-red-100 text-red-600 border-red-200 cursor-pointer"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                title="Klik untuk mengubah status"
                              >
                                {emp.isActive ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                                    Aktif
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 text-red-500" />
                                    Nonaktif
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(emp)}
                                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all cursor-pointer"
                                  title="Edit Akun"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(emp.id)}
                                  disabled={emp.id === "EMP001" || emp.id === currentUser?.id}
                                  className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Hapus Akun"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {filteredEmployees.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400">
                              Tidak ada akun karyawan yang sesuai filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Employees Pagination Footer */}
                <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Tampilkan</span>
                    <select
                      value={empItemsPerPage}
                      onChange={(e) => {
                        setEmpItemsPerPage(Number(e.target.value));
                        setEmpPage(1);
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-xs focus:ring-2 focus:ring-primary-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                    <span>akun per hal</span>
                  </div>

                  <div className="font-medium text-slate-500">
                    <strong>{filteredEmployees.length === 0 ? 0 : (empPage - 1) * empItemsPerPage + 1}</strong> - <strong>{Math.min(empPage * empItemsPerPage, filteredEmployees.length)}</strong> dari <strong>{filteredEmployees.length}</strong> akun
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEmpPage(1)}
                      disabled={empPage === 1}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                    >
                      «
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmpPage((prev) => Math.max(prev - 1, 1))}
                      disabled={empPage === 1}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                    >
                      ‹
                    </button>
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 border border-primary-200/60 rounded-lg font-extrabold">
                      {empPage} / {Math.ceil(filteredEmployees.length / empItemsPerPage) || 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEmpPage((prev) => Math.min(prev + 1, Math.ceil(filteredEmployees.length / empItemsPerPage) || 1))}
                      disabled={empPage >= Math.ceil(filteredEmployees.length / empItemsPerPage)}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmpPage(Math.ceil(filteredEmployees.length / empItemsPerPage) || 1)}
                      disabled={empPage >= Math.ceil(filteredEmployees.length / empItemsPerPage)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>

              {/* RBAC Rules display - Right Column (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-3">
                    Matriks Batas Akses Keamanan (RBAC)
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-primary-50/50 border border-primary-100/60 space-y-1.5">
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[9px] font-extrabold uppercase rounded-md">ADMIN</span>
                      <p className="text-xs font-bold text-slate-800">Akses Tanpa Batas (Full Access)</p>
                      <p className="text-[10px] text-slate-500">Dapat mengakses dasbor analitik lengkap, kasir POS, katalog inventaris supplier resmi, modul buyback hp bekas, audit keuangan komprehensif, dan manajemen akun karyawan.</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100/60 space-y-1.5">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-extrabold uppercase rounded-md">MANAGER</span>
                      <p className="text-xs font-bold text-slate-800">Akses Operasional & Stok</p>
                      <p className="text-[10px] text-slate-500">Dapat memantau dasbor analitik harian, melayani transaksi POS, mengelola data inventaris smartphone, dan menyetujui transaksi buyback. <b>Dilarang mengakses Laporan Keuangan Audit dan Manajemen Karyawan.</b></p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100/60 space-y-1.5">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-extrabold uppercase rounded-md">CASHIER (KASIR)</span>
                      <p className="text-xs font-bold text-slate-800">Akses Transaksi Kasir saja</p>
                      <p className="text-[10px] text-slate-500">Hanya memiliki akses penuh ke layar POS Kasir Penjualan untuk memasukkan transaksi belanja pelanggan dan mencetak struk thermal. <b>Dilarang membuka dasbor, stok inventaris, buyback, laporan audit keuangan, atau mengelola karyawan.</b></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeSubTab === "attendance" ? (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Section: Quick Clock In / Clock Out Action Widget */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
                <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -left-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Left Column: Live Digital Clock */}
                  <div className="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-slate-700/60 pb-5 lg:pb-0 lg:pr-6">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-primary-500/20 text-primary-400 rounded-xl">
                        <Clock className="h-5 w-5 animate-spin" style={{ animationDuration: '10s' }} />
                      </span>
                      <div>
                        <h3 className="font-black text-sm uppercase tracking-wider text-slate-200">
                          Sistem Presensi Digital Karyawan
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Catat jam masuk & keluar shift toko secara akurat & real-time
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center space-y-1">
                      <div className="text-3xl font-black font-mono tracking-wider text-emerald-400 drop-shadow-sm">
                        {currentTime.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                      </div>
                      <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-primary-400" />
                        <span>{currentTime.toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Status notification banner if any */}
                    {clockStatusMsg && (
                      <div className="p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 animate-fadeIn flex items-center gap-2">
                        <span>{clockStatusMsg}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Clock In / Clock Out Controls */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Pilih Karyawan:
                        </label>
                        <select
                          value={selectedEmpForClock}
                          onChange={(e) => {
                            setSelectedEmpForClock(e.target.value);
                            setClockStatusMsg("");
                          }}
                          className="w-full bg-slate-950/80 border border-slate-700 text-xs font-bold rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                              {emp.name} ({emp.role}) - {emp.outletName || "Semua Cabang"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">
                          Catatan / Keterangan Shift (Opsional):
                        </label>
                        <input
                          type="text"
                          value={clockNotes}
                          onChange={(e) => setClockNotes(e.target.value)}
                          placeholder="Contoh: Shift Pagi, Cabang Pusat..."
                          className="w-full bg-slate-950/80 border border-slate-700 text-xs rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    {/* Clock In & Clock Out Action Buttons */}
                    {(() => {
                      const currentSelectedEmp = employees.find(e => e.id === selectedEmpForClock) || employees[0];
                      const activeRecord = attendanceRecords.find(r => r.employeeId === (currentSelectedEmp?.id || selectedEmpForClock) && r.status === "CLOCKED_IN");
                      const isClockedIn = Boolean(activeRecord);

                      return (
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                          <div className="flex-1 w-full">
                            <button
                              type="button"
                              disabled={clockingAction || isClockedIn}
                              onClick={handleClockIn}
                              className={`w-full py-3 px-5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                                isClockedIn
                                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60"
                                  : "bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 shadow-emerald-500/20 ring-2 ring-emerald-400"
                              }`}
                            >
                              <Play className="h-4 w-4 fill-current" />
                              <span>
                                {isClockedIn ? "Sudah Clock In" : `CLOCK IN (${currentSelectedEmp?.name || "Karyawan"})`}
                              </span>
                            </button>
                          </div>

                          <div className="flex-1 w-full">
                            <button
                              type="button"
                              disabled={clockingAction || !isClockedIn}
                              onClick={handleClockOut}
                              className={`w-full py-3 px-5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                                !isClockedIn
                                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60"
                                  : "bg-rose-500 hover:bg-rose-600 active:scale-98 text-white shadow-rose-500/20 ring-2 ring-rose-400"
                              }`}
                            >
                              <Square className="h-4 w-4 fill-current" />
                              <span>
                                {!isClockedIn ? "Belum Clock In" : `CLOCK OUT (${currentSelectedEmp?.name || "Karyawan"})`}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>
              </div>

              {/* Attendance Analytics Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900">
                      {attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Presensi Hari Ini</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Clock className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-emerald-600">
                      {attendanceRecords.filter(r => r.status === "CLOCKED_IN").length}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aktif Bekerja Saat Ini</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-800">
                      {attendanceRecords.filter(r => r.status === "CLOCKED_OUT" && r.date === new Date().toISOString().split('T')[0]).length}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shift Selesai Hari Ini</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-4 flex items-center gap-3">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Timer className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-amber-600">
                      {Math.round(attendanceRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0) / 60 * 10) / 10} jam
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Jam Kerja Terakumulasi</div>
                  </div>
                </div>
              </div>

              {/* Attendance Log Table Card */}
              <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      Riwayat & Rekapitulasi Presensi Jam Kerja
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Daftar jam masuk, jam keluar, dan total durasi kerja harian seluruh staf toko.
                    </p>
                  </div>

                  <button
                    onClick={fetchAttendance}
                    disabled={loadingAttendance}
                    className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loadingAttendance ? "animate-spin" : ""}`} />
                    Segarkan Data
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 text-slate-400 h-4 w-4" />
                    <input
                      type="text"
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      placeholder="Cari nama karyawan, ID, atau catatan..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <input
                    type="date"
                    value={attendanceDateFilter}
                    onChange={(e) => setAttendanceDateFilter(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-primary-500"
                  />

                  <select
                    value={attendanceStatusFilter}
                    onChange={(e) => setAttendanceStatusFilter(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="ALL">Semua Status Shift</option>
                    <option value="CLOCKED_IN">Sedang Bekerja (Clocked In)</option>
                    <option value="CLOCKED_OUT">Selesai (Clocked Out)</option>
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Nama Karyawan</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Clock In</th>
                        <th className="px-4 py-3">Clock Out</th>
                        <th className="px-4 py-3">Durasi Shift</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Catatan</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {loadingAttendance ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-500" />
                            Memuat data presensi...
                          </td>
                        </tr>
                      ) : (() => {
                        const filtered = attendanceRecords.filter((rec) => {
                          const matchesSearch =
                            rec.employeeName.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                            rec.employeeId.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                            (rec.notes && rec.notes.toLowerCase().includes(attendanceSearch.toLowerCase()));
                          const matchesDate = !attendanceDateFilter || rec.date === attendanceDateFilter;
                          const matchesStatus =
                            attendanceStatusFilter === "ALL" ||
                            (attendanceStatusFilter === "CLOCKED_IN" && rec.status === "CLOCKED_IN") ||
                            (attendanceStatusFilter === "CLOCKED_OUT" && rec.status === "CLOCKED_OUT");
                          return matchesSearch && matchesDate && matchesStatus;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-slate-400">
                                <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                Tidak ada catatan presensi ditemukan.
                              </td>
                            </tr>
                          );
                        }

                        const start = (attendancePage - 1) * attendanceItemsPerPage;
                        const paginated = filtered.slice(start, start + attendanceItemsPerPage);

                        return paginated.map((rec) => {
                          const clockInFormatted = new Date(rec.clockInTime).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
                          const clockOutFormatted = rec.clockOutTime ? new Date(rec.clockOutTime).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : "—";
                          
                          let durationText = "Sedang Bekerja";
                          if (rec.durationMinutes) {
                            const hours = Math.floor(rec.durationMinutes / 60);
                            const mins = rec.durationMinutes % 60;
                            durationText = hours > 0 ? `${hours}j ${mins}m` : `${mins} menit`;
                          }

                          return (
                            <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 font-bold text-slate-900">
                                {rec.employeeName}
                                <div className="text-[10px] font-mono text-slate-400">{rec.employeeId}</div>
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-600">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                                  {rec.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                                {rec.date}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                                {clockInFormatted}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-slate-700">
                                {clockOutFormatted}
                              </td>
                              <td className="px-4 py-3 font-bold text-indigo-600">
                                {durationText}
                              </td>
                              <td className="px-4 py-3">
                                {rec.status === "CLOCKED_IN" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                    CLOCKED IN
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    CLOCKED OUT
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-[11px] text-slate-500 max-w-xs truncate">
                                {rec.notes || rec.clockOutNotes || "—"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) && (
                                  <button
                                    onClick={() => handleDeleteAttendance(rec.id, rec.employeeName)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus Presensi"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Attendance Pagination Footer */}
                {(() => {
                  const filtered = attendanceRecords.filter((rec) => {
                    const matchesSearch =
                      rec.employeeName.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                      rec.employeeId.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
                      (rec.notes && rec.notes.toLowerCase().includes(attendanceSearch.toLowerCase()));
                    const matchesDate = !attendanceDateFilter || rec.date === attendanceDateFilter;
                    const matchesStatus =
                      attendanceStatusFilter === "ALL" ||
                      (attendanceStatusFilter === "CLOCKED_IN" && rec.status === "CLOCKED_IN") ||
                      (attendanceStatusFilter === "CLOCKED_OUT" && rec.status === "CLOCKED_OUT");
                    return matchesSearch && matchesDate && matchesStatus;
                  });

                  return (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 rounded-b-xl">
                      <div className="flex items-center gap-2">
                        <span>Tampilkan</span>
                        <select
                          value={attendanceItemsPerPage}
                          onChange={(e) => {
                            setAttendanceItemsPerPage(Number(e.target.value));
                            setAttendancePage(1);
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-xs focus:ring-2 focus:ring-primary-500"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                        </select>
                        <span>presensi per hal</span>
                      </div>

                      <div className="font-medium text-slate-500">
                        Menampilkan <strong>{filtered.length === 0 ? 0 : (attendancePage - 1) * attendanceItemsPerPage + 1}</strong> - <strong>{Math.min(attendancePage * attendanceItemsPerPage, filtered.length)}</strong> dari <strong>{filtered.length}</strong> catatan
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setAttendancePage(1)}
                          disabled={attendancePage === 1}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                        >
                          «
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendancePage((prev) => Math.max(prev - 1, 1))}
                          disabled={attendancePage === 1}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                        >
                          ‹
                        </button>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-extrabold">
                          Hal {attendancePage} / {Math.ceil(filtered.length / attendanceItemsPerPage) || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttendancePage((prev) => Math.min(prev + 1, Math.ceil(filtered.length / attendanceItemsPerPage) || 1))}
                          disabled={attendancePage >= Math.ceil(filtered.length / attendanceItemsPerPage)}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                        >
                          ›
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttendancePage(Math.ceil(filtered.length / attendanceItemsPerPage) || 1)}
                          disabled={attendancePage >= Math.ceil(filtered.length / attendanceItemsPerPage)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                        >
                          »
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : activeSubTab === "activities" ? (
            <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl p-6 space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <History className="h-5 w-5 text-indigo-600 animate-pulse" />
                    Histori Aktivitas & Audit Trail Keamanan
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Merekam tindakan administratif sensitif, perubahan inventaris stok, dan transaksi yang dihapus secara real-time.
                  </p>
                </div>
                
                <button
                  onClick={fetchActivities}
                  disabled={loadingActivities}
                  className="px-3.5 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loadingActivities ? "animate-spin" : ""}`} />
                  Segarkan Log
                </button>
              </div>

              {/* Filtering and Search Controls */}
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3.5 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    value={activitiesSearch}
                    onChange={(e) => setActivitiesSearch(e.target.value)}
                    placeholder="Cari berdasarkan nama karyawan, ID, aksi, atau rincian tindakan..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Date Filter */}
                  <div className="relative sm:w-48 flex items-center gap-1.5">
                    <Calendar className="absolute left-3 top-3.5 text-slate-400 h-4 w-4 pointer-events-none" />
                    <input
                      type="date"
                      value={activitiesDateFilter}
                      onChange={(e) => setActivitiesDateFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white cursor-pointer"
                    />
                    {activitiesDateFilter && (
                      <button 
                        onClick={() => setActivitiesDateFilter("")}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                        title="Hapus filter tanggal"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative sm:w-64 flex items-center gap-1.5">
                    <Filter className="absolute left-3 top-3.5 text-slate-400 h-4 w-4 pointer-events-none" />
                    <select
                      value={activitiesFilter}
                      onChange={(e) => setActivitiesFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white cursor-pointer appearance-none"
                    >
                      <option value="ALL">Semua Jenis Aksi</option>
                      <option value="DELETE_TRANSACTION">Penghapusan Transaksi</option>
                      <option value="DELETE_PRODUCT">Penghapusan Produk</option>
                      <option value="UPDATE_PRODUCT">Perubahan Stok</option>
                      <option value="DELETE_EMPLOYEE">Penghapusan Karyawan</option>
                      <option value="UPDATE_EMPLOYEE">Perubahan Profil</option>
                      <option value="ADD_EMPLOYEE">Pendaftaran Karyawan</option>
                      <option value="ADD_PRODUCT">Penambahan Produk</option>
                      <option value="ADD_TRANSACTION">Transaksi Baru</option>
                      <option value="ADD_BUYBACK">Transaksi Buyback</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Logs Table Area */}
              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-extrabold uppercase">
                      <th className="p-4 w-44">Waktu (WITA)</th>
                      <th className="p-4 w-52">Aktor Karyawan</th>
                      <th className="p-4 w-44">Jenis Tindakan</th>
                      <th className="p-4">Rangkuman Rincian Tindakan (Audit Trail)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const filtered = activities.filter(act => {
                        const searchLower = activitiesSearch.toLowerCase();
                        const matchesSearch = 
                          act.userName.toLowerCase().includes(searchLower) ||
                          act.userId.toLowerCase().includes(searchLower) ||
                          act.details.toLowerCase().includes(searchLower) ||
                          act.action.toLowerCase().includes(searchLower) ||
                          act.targetId.toLowerCase().includes(searchLower);

                        const matchesActionFilter = activitiesFilter === "ALL" || act.action === activitiesFilter;
                        
                        let matchesDateFilter = true;
                        if (activitiesDateFilter) {
                          const actDate = new Date(act.timestamp);
                          const actDateString = actDate.getFullYear() + "-" + 
                            String(actDate.getMonth() + 1).padStart(2, '0') + "-" + 
                            String(actDate.getDate()).padStart(2, '0');
                          matchesDateFilter = actDateString === activitiesDateFilter;
                        }
                        
                        return matchesSearch && matchesActionFilter && matchesDateFilter;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="p-12 text-center text-slate-400 bg-slate-50/20">
                              <div className="max-w-md mx-auto space-y-2">
                                <History className="h-8 w-8 text-slate-300 mx-auto" />
                                <p className="text-xs font-semibold text-slate-500">Tidak ada log aktivitas ditemukan</p>
                                <p className="text-[10px] text-slate-400">Silakan sesuaikan filter pencarian Anda atau periksa kembali nanti.</p>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      const start = (activityPage - 1) * activityItemsPerPage;
                      const paginated = filtered.slice(start, start + activityItemsPerPage);

                      return paginated.map((act) => {
                        const isDeletion = act.action.startsWith("DELETE_");
                        const isCreation = act.action.startsWith("ADD_");
                        const isUpdate = act.action.startsWith("UPDATE_");
                        
                        const actionBadgeClass = isDeletion
                          ? "bg-red-50 text-red-700 border-red-150"
                          : isCreation
                            ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                            : isUpdate
                              ? "bg-amber-50 text-amber-700 border-amber-150"
                              : "bg-primary-50 text-primary-700 border-primary-150";

                        return (
                          <tr key={act.id} className="hover:bg-slate-50/30 transition-all">
                            <td className="p-4 font-mono font-medium text-slate-500">
                              {new Date(act.timestamp).toLocaleString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[10px] uppercase">
                                  {act.userName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{act.userName}</p>
                                  <p className="text-[9px] text-slate-400 font-semibold">{act.userId} • {act.userRole}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 border rounded-md text-[9px] font-black uppercase tracking-wide ${actionBadgeClass}`}>
                                {act.action.replace("DELETE_", "HAPUS ").replace("UPDATE_", "UBAH ").replace("ADD_", "TAMBAH ")}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <p className="text-slate-700 font-medium text-[11px] leading-relaxed">{act.details}</p>
                                <p className="text-[10px] text-slate-400 font-mono">ID Referensi: <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 text-[9px] font-bold">{act.targetId}</span></p>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Activities Pagination Footer */}
              {(() => {
                const filtered = activities.filter(act => {
                  const searchLower = activitiesSearch.toLowerCase();
                  const matchesSearch = 
                    act.userName.toLowerCase().includes(searchLower) ||
                    act.userId.toLowerCase().includes(searchLower) ||
                    act.details.toLowerCase().includes(searchLower) ||
                    act.action.toLowerCase().includes(searchLower) ||
                    act.targetId.toLowerCase().includes(searchLower);

                  const matchesActionFilter = activitiesFilter === "ALL" || act.action === activitiesFilter;
                  
                  let matchesDateFilter = true;
                  if (activitiesDateFilter) {
                    const actDate = new Date(act.timestamp);
                    const actDateString = actDate.getFullYear() + "-" + 
                      String(actDate.getMonth() + 1).padStart(2, '0') + "-" + 
                      String(actDate.getDate()).padStart(2, '0');
                    matchesDateFilter = actDateString === activitiesDateFilter;
                  }
                  
                  return matchesSearch && matchesActionFilter && matchesDateFilter;
                });

                return (
                  <div className="px-4 py-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span>Tampilkan</span>
                      <select
                        value={activityItemsPerPage}
                        onChange={(e) => {
                          setActivityItemsPerPage(Number(e.target.value));
                          setActivityPage(1);
                        }}
                        className="bg-white border border-slate-300 rounded-lg px-2 py-1 font-semibold text-xs focus:ring-2 focus:ring-primary-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span>log per hal</span>
                    </div>

                    <div className="font-medium text-slate-500">
                      Menampilkan <strong>{filtered.length === 0 ? 0 : (activityPage - 1) * activityItemsPerPage + 1}</strong> - <strong>{Math.min(activityPage * activityItemsPerPage, filtered.length)}</strong> dari <strong>{filtered.length}</strong> log
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActivityPage(1)}
                        disabled={activityPage === 1}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                      >
                        «
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityPage((prev) => Math.max(prev - 1, 1))}
                        disabled={activityPage === 1}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                      >
                        ‹
                      </button>
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg font-extrabold">
                        Hal {activityPage} / {Math.ceil(filtered.length / activityItemsPerPage) || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActivityPage((prev) => Math.min(prev + 1, Math.ceil(filtered.length / activityItemsPerPage) || 1))}
                        disabled={activityPage >= Math.ceil(filtered.length / activityItemsPerPage)}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                      >
                        ›
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivityPage(Math.ceil(filtered.length / activityItemsPerPage) || 1)}
                        disabled={activityPage >= Math.ceil(filtered.length / activityItemsPerPage)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                      >
                        »
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : activeSubTab === "payroll" ? (
            <div className="space-y-6">
              {/* Top Banner Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Total Penggajian Diterbitkan</span>
                    <p className="text-xl font-black text-white mt-1">
                      Rp {payrolls.reduce((sum, p) => sum + p.netSalary, 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-indigo-300 mt-1 block">{payrolls.length} Slip Gaji Disimpan</span>
                  </div>
                  <div className="p-3 bg-indigo-800/50 rounded-xl text-amber-400">
                    <Receipt className="h-7 w-7" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Potongan Kasbon Otomatis</span>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      Rp {payrolls.reduce((sum, p) => sum + (p.loanDeduction || 0), 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Dipotong Langsung dari Slip</span>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
                    <Wallet className="h-7 w-7" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Aksi Cepat Payroll</span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">Proses Slip Gaji Baru</p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenCreatePayrollModal}
                    className="mt-3 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-primary-600/20 cursor-pointer transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Buat Slip Gaji & Proses Payroll
                  </button>
                </div>
              </div>

              {/* Payroll History Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-primary-500" />
                      Histori Slip Gaji & Penggajian Karyawan
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Daftar rekapan slip gaji, komisi target sales, dan potongan kasbon karyawan.</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-extrabold uppercase">
                        <th className="p-3.5">ID / No Slip</th>
                        <th className="p-3.5">Karyawan</th>
                        <th className="p-3.5">Bulan & Waktu</th>
                        <th className="p-3.5 text-right">Gaji Pokok</th>
                        <th className="p-3.5 text-right">Tunjangan & Bonus</th>
                        <th className="p-3.5 text-right">Potongan Kasbon</th>
                        <th className="p-3.5 text-right">Take Home Pay</th>
                        <th className="p-3.5 text-center">Status & Metode</th>
                        <th className="p-3.5 text-center">Aksi Digital</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {payrolls.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400">
                            Belum ada rekam data penggajian. Klik "Buat Slip Gaji" untuk memulai.
                          </td>
                        </tr>
                      ) : (
                        payrolls.map((pay) => (
                          <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                            <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{pay.id}</td>
                            <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{pay.employeeName}</td>
                            <td className="p-3.5">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block">{pay.month}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{pay.paymentDate}</span>
                            </td>
                            <td className="p-3.5 text-right font-medium text-slate-600 dark:text-slate-400">Rp {pay.basicSalary.toLocaleString("id-ID")}</td>
                            <td className="p-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              +Rp {(pay.allowances + pay.bonuses).toLocaleString("id-ID")}
                            </td>
                            <td className="p-3.5 text-right font-bold text-amber-600 dark:text-amber-400">
                              -Rp {pay.loanDeduction.toLocaleString("id-ID")}
                            </td>
                            <td className="p-3.5 text-right font-black text-slate-900 dark:text-white text-sm">
                              Rp {pay.netSalary.toLocaleString("id-ID")}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                {pay.status} ({pay.paymentMethod})
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setActiveSlip(pay);
                                    setIsSlipModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-[10px] flex items-center gap-1 border border-indigo-200/50 dark:border-indigo-800/50 cursor-pointer"
                                  title="Lihat / Cetak Slip Digital"
                                >
                                  <FileText className="h-3 w-3" />
                                  Slip Gaji
                                </button>
                                <a
                                  href={getWhatsAppPayrollUrl(pay)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 cursor-pointer"
                                  title="Kirim Slip via WhatsApp"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeSubTab === "loans" ? (
            <div className="space-y-6">
              {/* Top Banner Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-amber-900 to-slate-900 text-white p-5 rounded-2xl border border-amber-800/80 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider block">Sisa Total Utang Kasbon Aktif</span>
                    <p className="text-xl font-black text-amber-300 mt-1">
                      Rp {employeeLoans.reduce((sum, l) => sum + l.remainingAmount, 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-amber-200 mt-1 block">
                      {employeeLoans.filter(l => l.status === "ACTIVE").length} Pinjaman Aktif Karyawan
                    </span>
                  </div>
                  <div className="p-3 bg-amber-800/50 rounded-xl text-amber-300">
                    <Wallet className="h-7 w-7" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Pelunasan Cicilan</span>
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      Rp {employeeLoans.reduce((sum, l) => sum + (l.repayments ? l.repayments.reduce((s, r) => s + r.amount, 0) : 0), 0).toLocaleString("id-ID")}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Telah Dibayar / Potong Gaji</span>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-7 w-7" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Pencairan Kasbon Baru</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-0.5">Catat Pinjaman Uang Karyawan</p>
                  </div>
                  <button
                    onClick={handleOpenCreateLoanModal}
                    className="mt-3 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 cursor-pointer transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Cairkan Kasbon Baru (Tanda Terima Digital)
                  </button>
                </div>
              </div>

              {/* Loans Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-amber-500" />
                      Daftar Kasbon & Pinjaman Karyawan
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Rekap pinjaman, sisa utang, bukti tanda terima digital, dan riwayat pelunasan.</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-extrabold uppercase">
                        <th className="p-3.5">No Voucher</th>
                        <th className="p-3.5">Karyawan</th>
                        <th className="p-3.5">Waktu & Tanggal</th>
                        <th className="p-3.5">Keperluan</th>
                        <th className="p-3.5 text-right">Awal Kasbon</th>
                        <th className="p-3.5 text-right">Sisa Utang</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5 text-center">Aksi Pelunasan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {employeeLoans.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400">
                            Belum ada data pinjaman kasbon karyawan.
                          </td>
                        </tr>
                      ) : (
                        employeeLoans.map((loan) => (
                          <tr key={loan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                            <td className="p-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">{loan.id}</td>
                            <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">{loan.employeeName}</td>
                            <td className="p-3.5 text-slate-500 dark:text-slate-400 font-mono text-[10px]">{loan.date}</td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">{loan.reason}</td>
                            <td className="p-3.5 text-right font-medium text-slate-600 dark:text-slate-400">Rp {loan.amount.toLocaleString("id-ID")}</td>
                            <td className="p-3.5 text-right font-black text-amber-600 dark:text-amber-400 text-sm">
                              Rp {loan.remainingAmount.toLocaleString("id-ID")}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                loan.status === "PAID_OFF"
                                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              }`}>
                                {loan.status === "PAID_OFF" ? "LUNAS ✓" : "AKTIF"}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {loan.remainingAmount > 0 && (
                                  <button
                                    onClick={() => handleOpenRepayModal(loan)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-xs"
                                  >
                                    Bayar Cicilan
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setActiveLoanReceipt(loan);
                                    setIsLoanReceiptModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[10px] cursor-pointer"
                                  title="Lihat Voucher Tanda Terima"
                                >
                                  Voucher
                                </button>
                                <a
                                  href={getWhatsAppLoanUrl(loan)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 cursor-pointer"
                                  title="Kirim via WhatsApp"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Edit / Create Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                {editingEmployee ? `Edit Akun: ${editingEmployee.name}` : "Tambah Akun Karyawan Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-50 border border-slate-200 p-2 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap Karyawan</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Siti Rahma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username Login</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    required
                    disabled={editingEmployee !== null}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: sitir"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                {editingEmployee && <span className="text-[9px] text-slate-400 block mt-1">Username login tidak dapat diubah setelah dibuat.</span>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Email Resmi</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: sitir@phonepos.id"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nomor Telepon / WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Tempat Tinggal</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Jl. Sudirman No. 123, Medan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kontak Darurat (Keluarga/Suami/Istri)</label>
                <div className="relative">
                  <AlertCircle className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Contoh: Budi (Suami) - 081987654321"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peran Hak Akses (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value={UserRole.CASHIER}>CASHIER (Akses Layanan Kasir Saja)</option>
                  <option value={UserRole.MANAGER}>MANAGER (Akses Operasional & Stok)</option>
                  <option value={UserRole.ADMIN}>ADMIN (Akses Penuh Seluruh Sistem)</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {editingEmployee ? "Reset Sandi / PIN Baru (Opsional)" : "Sandi PIN Otentikasi"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-slate-400 h-4 w-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingEmployee}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingEmployee ? "Biarkan kosong jika tidak ingin diubah" : "Masukkan kata sandi login"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Status active/inactive for editing */}
              {editingEmployee && editingEmployee.id !== "EMP001" && (
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="active-checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="active-checkbox" className="text-xs font-bold text-slate-700">Akun Karyawan Aktif</label>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-primary-600/10 disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Setup Modal */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl text-white">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary-400" />
                  Atur Target Penjualan Staf ({selectedTargetMonth})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Tentukan nilai target omzet dan unit penjualan untuk tiap staf bulan ini.</p>
              </div>
              <button
                onClick={() => setIsTargetModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold text-xs bg-slate-800 border border-slate-700 p-2 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {employees.map(emp => {
                const targetData = editingTargets[emp.id] || { amount: 50000000, units: 50, type: "AMOUNT", notes: "" };
                const currentType = targetData.type || "AMOUNT";

                return (
                  <div key={emp.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary-600/30 text-primary-300 flex items-center justify-center font-bold text-xs">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">{emp.name}</p>
                          <p className="text-[10px] text-slate-400">{emp.role}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">{emp.username}</span>
                    </div>

                    {/* Target Type Selector Buttons */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">Metode Target Utama:</label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTargets(prev => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], type: "AMOUNT" }
                            }));
                          }}
                          className={`py-1 px-2 rounded text-[10px] font-bold transition-all ${currentType === "AMOUNT" ? "bg-primary-600 text-white shadow-xs" : "text-slate-400 hover:text-white"}`}
                        >
                          💵 Rp Omzet
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTargets(prev => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], type: "UNITS" }
                            }));
                          }}
                          className={`py-1 px-2 rounded text-[10px] font-bold transition-all ${currentType === "UNITS" ? "bg-primary-600 text-white shadow-xs" : "text-slate-400 hover:text-white"}`}
                        >
                          📱 Unit HP
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTargets(prev => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], type: "BOTH" }
                            }));
                          }}
                          className={`py-1 px-2 rounded text-[10px] font-bold transition-all ${currentType === "BOTH" ? "bg-primary-600 text-white shadow-xs" : "text-slate-400 hover:text-white"}`}
                        >
                          ⚖️ Dual Target
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Target Omzet Bulanan (Rp):</label>
                        <input
                          type="text"
                          value={Number(targetData.amount).toLocaleString("id-ID")}
                          onChange={(e) => {
                            const val = Number(e.target.value.replace(/\D/g, "")) || 0;
                            setEditingTargets(prev => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], amount: val }
                            }));
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-emerald-400 outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Target Jumlah Unit HP (Unit):</label>
                        <input
                          type="number"
                          value={targetData.units}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setEditingTargets(prev => ({
                              ...prev,
                              [emp.id]: { ...prev[emp.id], units: val }
                            }));
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTargets}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-primary-600/20"
              >
                Simpan Target Staf
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Modal Pencairan Kasbon Baru */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-amber-500" />
                  Form Pencairan Kasbon / Pinjaman Karyawan
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Pencairan uang tunai ke karyawan yang akan otomatis dicatat di arus kas pengeluaran.</p>
              </div>
              <button
                onClick={() => setIsLoanModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Pilih Karyawan Penerima:
                </label>
                <select
                  value={loanEmpId}
                  onChange={(e) => setLoanEmpId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role}) - {e.id}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Nominal Kasbon (Rp):
                  </label>
                  <input
                    type="text"
                    required
                    value={loanAmount ? Number(loanAmount).toLocaleString("id-ID") : ""}
                    onChange={(e) => setLoanAmount(e.target.value.replace(/\D/g, ""))}
                    placeholder="Contoh: 500.000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-black text-amber-600 dark:text-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Waktu / Tanggal:
                  </label>
                  <input
                    type="text"
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Keperluan / Peruntukan:
                </label>
                <input
                  type="text"
                  required
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                  placeholder="Misal: Keperluan Darurat Keluarga / Servis Motor"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Tanda Tangan Digital Penerima Kasbon:
                </label>
                <SignaturePad
                  onSignatureChange={(dataUrl) => setLoanSignature(dataUrl)}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-amber-600/20"
                >
                  Cairkan & Simpan Kasbon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Bayar Cicilan Kasbon */}
      {isRepayModalOpen && repayLoan && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Pembayaran Cicilan Kasbon Karyawan
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Penerimaan pembayaran cicilan dari {repayLoan.employeeName}.</p>
              </div>
              <button
                onClick={() => setIsRepayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-1 text-xs">
              <p className="font-bold text-amber-800 dark:text-amber-300">Voucher No: {repayLoan.id}</p>
              <p className="text-amber-700 dark:text-amber-400">Total Pinjaman Awal: Rp {repayLoan.amount.toLocaleString("id-ID")}</p>
              <p className="font-black text-amber-900 dark:text-amber-200 text-sm">Sisa Utang Saat Ini: Rp {repayLoan.remainingAmount.toLocaleString("id-ID")}</p>
            </div>

            <form onSubmit={handleSaveRepayment} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Nominal Pembayaran / Cicilan (Rp):
                </label>
                <input
                  type="text"
                  required
                  value={repayAmount ? Number(repayAmount).toLocaleString("id-ID") : ""}
                  onChange={(e) => setRepayAmount(e.target.value.replace(/\D/g, ""))}
                  placeholder={`Maksimal Rp ${repayLoan.remainingAmount.toLocaleString("id-ID")}`}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-black text-emerald-600 dark:text-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Metode Pembayaran:
                </label>
                <select
                  value={repayMethod}
                  onChange={(e) => setRepayMethod(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="CASH">CASH (Tunai)</option>
                  <option value="TRANSFER">TRANSFER BANK</option>
                  <option value="SALARY_DEDUCTION">POTONG GAJI</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Catatan Pembayaran:
                </label>
                <input
                  type="text"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder="Misal: Cicilan ke-1 tunai di kasir"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Tanda Tangan Digital Pembayar:
                </label>
                <SignaturePad
                  onSignatureChange={(dataUrl) => setRepaySignature(dataUrl)}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRepayModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  Simpan Cicilan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Voucher Tanda Terima Digital Kasbon */}
      {isLoanReceiptModalOpen && activeLoanReceipt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  Tanda Terima Digital Kasbon
                </h3>
              </div>
              <button
                onClick={() => setIsLoanReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs border border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <div className="text-center border-b border-dashed pb-3 space-y-0.5">
                <p className="font-black text-sm tracking-wider text-indigo-900">FONEPOS SMARTPHONE STORE</p>
                <p className="text-[10px] text-slate-500 font-sans">Voucher Kasbon / Pinjaman Karyawan</p>
                <p className="text-[10px] font-bold text-slate-700 mt-1">{activeLoanReceipt.id}</p>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Penerima:</span>
                  <span className="font-bold text-slate-800">{activeLoanReceipt.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu & Tanggal:</span>
                  <span className="text-slate-800">{activeLoanReceipt.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Keperluan:</span>
                  <span className="text-slate-800">{activeLoanReceipt.reason}</span>
                </div>
                <div className="flex justify-between border-t border-dashed pt-1 font-bold">
                  <span>Nominal Pencairan:</span>
                  <span className="text-amber-600 text-sm">Rp {activeLoanReceipt.amount.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Sisa Utang Aktif:</span>
                  <span className="text-slate-800">Rp {activeLoanReceipt.remainingAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {activeLoanReceipt.signatureDataUrl && (
                <div className="pt-3 border-t border-dashed text-center">
                  <p className="text-[9px] font-sans font-bold text-slate-400 uppercase mb-1">Tanda Tangan Digital Karyawan:</p>
                  <img
                    src={activeLoanReceipt.signatureDataUrl}
                    alt="Tanda Tangan"
                    className="h-16 mx-auto bg-white border border-slate-200 rounded-lg p-1 object-contain"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={getWhatsAppLoanUrl(activeLoanReceipt)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Share2 className="h-3.5 w-3.5" />
                WhatsApp
              </a>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Cetak Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Buat Slip Gaji Digital */}
      {isPayrollModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary-500" />
                  Proses Slip Gaji & Payroll Karyawan
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Hitung otomatis gaji pokok, bonus target, dan pemotongan utang kasbon.</p>
              </div>
              <button
                onClick={() => setIsPayrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePayroll} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Pilih Karyawan:
                  </label>
                  <select
                    value={payEmpId}
                    onChange={(e) => {
                      setPayEmpId(e.target.value);
                      // Recalculate auto loan deduction
                      const empActiveLoans = employeeLoans.filter(l => l.employeeId === e.target.value && l.status === "ACTIVE" && l.remainingAmount > 0);
                      const totalDebt = empActiveLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
                      setPayLoanDeduction(totalDebt > 0 ? String(totalDebt) : "0");
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Periode Bulan:
                  </label>
                  <input
                    type="month"
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Gaji Pokok (Rp):
                  </label>
                  <input
                    type="text"
                    value={payBasicSalary ? Number(payBasicSalary).toLocaleString("id-ID") : ""}
                    onChange={(e) => setPayBasicSalary(e.target.value.replace(/\D/g, ""))}
                    placeholder="Misal: 3.500.000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Tunjangan / Makan (Rp):
                  </label>
                  <input
                    type="text"
                    value={payAllowances ? Number(payAllowances).toLocaleString("id-ID") : ""}
                    onChange={(e) => setPayAllowances(e.target.value.replace(/\D/g, ""))}
                    placeholder="Misal: 500.000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Bonus Target / Komisi (Rp):
                  </label>
                  <input
                    type="text"
                    value={payBonuses ? Number(payBonuses).toLocaleString("id-ID") : ""}
                    onChange={(e) => setPayBonuses(e.target.value.replace(/\D/g, ""))}
                    placeholder="Misal: 250.000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Potongan Kasbon (Otomatis) (Rp):
                  </label>
                  <input
                    type="text"
                    value={payLoanDeduction ? Number(payLoanDeduction).toLocaleString("id-ID") : ""}
                    onChange={(e) => setPayLoanDeduction(e.target.value.replace(/\D/g, ""))}
                    placeholder="Isi 0 jika tidak ada potongan"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Take Home Pay Calculation Preview */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Perhitungan Gaji Bersih (Take Home Pay):</span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-black">
                    Rp {Math.max(0, (Number(payBasicSalary) || 0) + (Number(payAllowances) || 0) + (Number(payBonuses) || 0) - (Number(payLoanDeduction) || 0)).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Metode Pembayaran:
                  </label>
                  <select
                    value={payPaymentMethod}
                    onChange={(e) => setPayPaymentMethod(e.target.value as "TRANSFER" | "CASH")}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="TRANSFER">TRANSFER BANK</option>
                    <option value="CASH">CASH (Tunai)</option>
                  </select>
                </div>

                {payPaymentMethod === "TRANSFER" && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Nama Bank & No Rekening:
                    </label>
                    <input
                      type="text"
                      value={payBankName}
                      onChange={(e) => setPayBankName(e.target.value)}
                      placeholder="BCA - 1234567890"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-primary-600/20"
                >
                  Terbitkan Slip Gaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal Official Slip Gaji Digital Viewer */}
      {isSlipModalOpen && activeSlip && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  SLIP GAJI DIGITALLY VERIFIED
                </h3>
              </div>
              <button
                onClick={() => setIsSlipModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 border border-slate-200 p-5 rounded-2xl bg-slate-50/50">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h4 className="font-black text-base text-indigo-950">FONEPOS SMARTPHONE STORE</h4>
                  <p className="text-[10px] text-slate-500">Jl. Malioboro No. 88, Yogyakarta • (0274) 555-888</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-mono text-[9px] font-extrabold block">
                    {activeSlip.id}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold block mt-1">Periode: {activeSlip.month}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Nama Karyawan</span>
                  <span className="font-extrabold text-slate-800">{activeSlip.employeeName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Tanggal Pembayaran</span>
                  <span className="font-bold text-slate-700">{activeSlip.paymentDate}</span>
                </div>
              </div>

              {/* Rincian Komponen Gaji */}
              <div className="space-y-2 border-t border-b border-slate-200 py-3 text-xs">
                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Rincian Komponen Penerimaan & Potongan:</p>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Gaji Pokok:</span>
                  <span className="font-bold text-slate-800">Rp {activeSlip.basicSalary.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Tunjangan Operasional:</span>
                  <span className="font-bold text-slate-800">Rp {activeSlip.allowances.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Bonus & Komisi Target:</span>
                  <span className="font-bold text-emerald-600">+Rp {activeSlip.bonuses.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-600">Potongan Utang Kasbon:</span>
                  <span className="font-bold text-amber-600">-Rp {activeSlip.loanDeduction.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Gaji Bersih (THP)</span>
                  <p className="text-lg font-black text-indigo-900">Rp {activeSlip.netSalary.toLocaleString("id-ID")}</p>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-medium">
                  Metode: <b className="text-slate-800">{activeSlip.paymentMethod}</b> ({activeSlip.bankName || "Cash"})
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={getWhatsAppPayrollUrl(activeSlip)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Share2 className="h-3.5 w-3.5" />
                WhatsApp Slip
              </a>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Cetak Slip Gaji
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
