import { useState, useMemo } from 'react';
import type { SortingState } from '@tanstack/react-table';
import type { StaffProfile, RiskLevel } from '../../../types/enterprise';

export function useAdminDashboardState() {
  const [searchParams, setSearchParams] = useState(new URLSearchParams());
  const [activeTab, setActiveTab] = useState('Overview');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL');
  const [selectedRollNo, setSelectedRollNo] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentOffset, setStudentOffset] = useState(0);
  const [studentSemesterFilter, setStudentSemesterFilter] = useState<string>('ALL');
  const [studentBatchFilter, setStudentBatchFilter] = useState<string>('ALL');
  const [studentSectionFilter, setStudentSectionFilter] = useState<string>('ALL');
  const [studentRiskOnly, setStudentRiskOnly] = useState(false);
  const [studentSortBy, setStudentSortBy] = useState<'rank' | 'name' | 'roll_no'>('rank');
  const [studentSortDir, setStudentSortDir] = useState<'asc' | 'desc'>('asc');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'cgpa', desc: true }]);
  const [riskLevel, setRiskLevel] = useState<RiskLevel | ''>('Critical');
  const [staffForm, setStaffForm] = useState({ username: '', name: '', email: '', department: '', password: '' });
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffToDelete, setStaffToDelete] = useState<StaffProfile | null>(null);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffSubjectKeys, setStaffSubjectKeys] = useState<string[]>([]);
  const [staffSubjectSearch, setStaffSubjectSearch] = useState('');
  const [staffSubjectSemFilter, setStaffSubjectSemFilter] = useState<'ALL' | number>('ALL');

  const resetStaffForm = () => {
    setStaffForm({ username: '', name: '', email: '', department: '', password: '' });
    setEditingStaff(null);
    setStaffSubjectKeys([]);
  };

  return {
    // Search params
    searchParams,
    setSearchParams,
    activeTab,
    setActiveTab,
    
    // Subject/Semester filters
    selectedSubjectCode,
    setSelectedSubjectCode,
    selectedSemester,
    setSelectedSemester,
    selectedRollNo,
    setSelectedRollNo,
    
    // Student filters
    studentSearch,
    setStudentSearch,
    studentOffset,
    setStudentOffset,
    studentSemesterFilter,
    setStudentSemesterFilter,
    studentBatchFilter,
    setStudentBatchFilter,
    studentSectionFilter,
    setStudentSectionFilter,
    studentRiskOnly,
    setStudentRiskOnly,
    studentSortBy,
    setStudentSortBy,
    studentSortDir,
    setStudentSortDir,
    sorting,
    setSorting,
    riskLevel,
    setRiskLevel,
    
    // Staff form state
    staffForm,
    setStaffForm,
    editingStaff,
    setEditingStaff,
    staffSearch,
    setStaffSearch,
    staffToDelete,
    setStaffToDelete,
    staffModalOpen,
    setStaffModalOpen,
    staffSubjectKeys,
    setStaffSubjectKeys,
    staffSubjectSearch,
    setStaffSubjectSearch,
    staffSubjectSemFilter,
    setStaffSubjectSemFilter,
    
    // Helpers
    resetStaffForm,
  };
}
