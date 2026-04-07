import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Users, AlertCircle, CheckCircle2, Loader2, Send, ShieldAlert, Clock, 
  BookOpen, ChevronDown, ChevronUp, Search, Mic, MicOff, Volume2, 
  Trash2, Filter, History
} from 'lucide-react';
import api from '../api/client';
import EditAttendanceModal from './EditAttendanceModal';

export default function AttendancePanel({ subjects }) {
  const queryClient = useQueryClient();
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.subject_id || '');
  const [period, setPeriod] = useState(1);
  const [absentees, setAbsentees] = useState([]);
  const [odList, setOdList] = useState([]); // New 'On Duty' state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [showTodaySummary, setShowTodaySummary] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Section selection — auto-filled from the assigned subject's section
  const [selectedSection, setSelectedSection] = useState(subjects[0]?.section || '');

  // Search and Filter for subjects
  const [subjectSearch, setSubjectSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [studentSearchDraft, setStudentSearchDraft] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Voice Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [voiceNotice, setVoiceNotice] = useState('');
  const [voiceDraftSelection, setVoiceDraftSelection] = useState({});
  const [voiceDraftUnresolved, setVoiceDraftUnresolved] = useState({ absent: [], od: [] });
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const studentCardRefs = useRef({});
  const reviewRef = useRef(null);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState('');
  const [voiceError, setVoiceError] = useState(null);

  const selectedSubject = subjects.find(s => s.subject_id === parseInt(selectedSubjectId));
  const isSubstitute = !!selectedSubjectId && !selectedSubject;

  // Derive available sections for the selected subject from the assigned subjects list
  // A staff may be assigned to the same subject for multiple sections
  const availableSections = React.useMemo(() => {
    const secs = subjects
      .filter(s => s.subject_id === parseInt(selectedSubjectId))
      .map(s => s.section)
      .filter(Boolean);
    // Deduplicate
    return [...new Set(secs)];
  }, [subjects, selectedSubjectId]);

  // Fetch all subjects for substitute mode
  const { data: allSubjects = [], isLoading: isLoadingAllSubjects } = useQuery({
    queryKey: ['all-subjects-for-attendance'],
    queryFn: () => api.get('staff/subjects/all').then(res => res || []).catch(() => []),
    retry: false,
  });

  // Build combined subject list: assigned + all (for substitute)
  const subjectOptions = React.useMemo(() => {
    const assignedIds = new Set(subjects.map(s => s.subject_id));
    const deduped = [...subjects];
    (allSubjects || []).forEach(s => {
      if (!assignedIds.has(s.id)) {
        deduped.push({ subject_id: s.id, subject_name: s.name, course_code: s.course_code, semester: s.semester, _is_other: true });
      }
    });
    return deduped;
  }, [subjects, allSubjects]);

  const selectedOption = subjectOptions.find(s => s.subject_id === parseInt(selectedSubjectId));
  const isMarkedAsSubstitute = selectedOption?._is_other;

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['staff-subject-students', selectedSubjectId, selectedSection],
    queryFn: async () => {
      if (!selectedSubjectId) return [];
      const sectionParam = selectedSection ? `?section=${encodeURIComponent(selectedSection)}` : '';
      const data = await api.get(`staff/subjects/${selectedSubjectId}/students${sectionParam}`);
      const studentsData = Array.isArray(data) ? data : (data?.students || []);
      return studentsData;
    },
    enabled: !!selectedSubjectId,
    staleTime: 30000,
  });

  // Today's summary
  const { data: todaySummary = [], isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['staff-today-summary', date],
    queryFn: () => api.get(`staff/attendance/today-summary?target_date=${date}`).then(res => res || []).catch(() => []),
    enabled: showTodaySummary,
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('staff/attendance/period', data),
    onSuccess: () => {
      setAbsentees([]);
      setOdList([]);
      setError('');
      queryClient.invalidateQueries({ queryKey: ['staff-today-summary'] });
      refetchSummary();
      setConfirmationMsg('Attendance report submitted successfully!');
      setShowConfirmation(true);
    },
    onError: (err) => {
      const msg = err?.response?.data?.detail || err?.message || 'Could not submit attendance';
      setError(msg);
    }
  });

  const handleSubmit = () => {
    if (!selectedOption) return;
    mutation.mutate({
      subject_id: selectedOption.subject_id,
      date,
      period: parseInt(period),
      absentees,
      od_list: odList,
      semester: selectedOption.semester || 1,
      section: selectedSection || undefined,
    });
  };

  const toggleAttendance = (rollNo) => {
    // Toggling: P -> A -> O -> P
    const isAbsent = absentees.includes(rollNo);
    const isOd = odList.includes(rollNo);

    if (!isAbsent && !isOd) {
      // P -> A
      setAbsentees(prev => [...prev, rollNo]);
    } else if (isAbsent) {
      // A -> O
      setAbsentees(prev => prev.filter(r => r !== rollNo));
      setOdList(prev => [...prev, rollNo]);
    } else {
      // O -> P
      setOdList(prev => prev.filter(r => r !== rollNo));
    }
  };

  const markAllPresent = () => {
    setAbsentees([]);
    setOdList([]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        processVoice(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Microphone access denied or error occurred.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks for privacy
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processVoice = async (audioBlob) => {
    setVoiceProcessing(true);
    setVoiceError(null);
    setVoiceResult(null);
    setVoiceNotice('');
    try {
      const formData = new FormData();
      const roster = students?.map(s => `${s.roll_no} - ${s.name}`) || [];
      formData.append('audio', audioBlob, 'attendance.webm');
      formData.append('roster', JSON.stringify(roster));

      const res = await api.post('ai/attendance/voice-parse', formData, {
        timeout: 90000 // Voice parsing needs more time (90s)
      });
      setVoiceResult(res);
      
      const { draft, unresolved } = createDraftSelection(res?.parsed || {});
      setVoiceDraftSelection(draft);
      setVoiceDraftUnresolved(unresolved);
      setVoiceNotice('Review suggestions and confirm before applying.');

      // Auto-scroll to review
      setTimeout(() => {
        reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (err) {
      setVoiceError("AI Processing failed: " + (err?.response?.data?.detail || err.message));
    } finally {
      setVoiceProcessing(false);
    }
  };

  const normalizeRoll = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const digitsOnly = (value) => String(value || '').replace(/\D/g, '');
  const normalizeText = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const resolveMentionsToRolls = (items = []) => {
    const studentList = Array.isArray(students) ? students : [];
    const rollMap = new Map();
    const digitsMap = new Map();

    studentList.forEach((student) => {
      const roll = String(student.roll_no || '').trim();
      const rollNorm = normalizeRoll(roll);
      const rollDigits = digitsOnly(roll);
      if (rollNorm) rollMap.set(rollNorm, roll);
      if (rollDigits && !digitsMap.has(rollDigits)) digitsMap.set(rollDigits, roll);
    });

    const resolved = [];
    const unresolved = [];

    items.forEach((raw) => {
      const rawText = String(raw || '').trim();
      if (!rawText) return;

      const rawNorm = normalizeRoll(rawText);
      const rawDigits = digitsOnly(rawText);
      if (rollMap.has(rawNorm)) {
        resolved.push(rollMap.get(rawNorm));
        return;
      }
      if (rawDigits && digitsMap.has(rawDigits)) {
        resolved.push(digitsMap.get(rawDigits));
        return;
      }

      const phrase = normalizeText(rawText);
      const byName = studentList.find((student) => {
        const name = normalizeText(student.name || '');
        return name && (phrase.includes(name) || name.includes(phrase));
      });
      if (byName?.roll_no) {
        resolved.push(String(byName.roll_no));
      } else {
        unresolved.push(rawText);
      }
    });

    return {
      resolved: [...new Set(resolved)],
      unresolved,
    };
  };

  const createDraftSelection = (parsed = {}) => {
    const absentMentions = Array.isArray(parsed.absent) ? parsed.absent : [];
    const odMentions = Array.isArray(parsed.od) ? parsed.od : [];

    const absentResolved = resolveMentionsToRolls(absentMentions);
    const odResolved = resolveMentionsToRolls(odMentions);

    const draft = {};
    absentResolved.resolved.forEach((roll) => {
      draft[roll] = 'A';
    });
    odResolved.resolved.forEach((roll) => {
      draft[roll] = 'O';
    });

    return {
      draft,
      unresolved: {
        absent: absentResolved.unresolved,
        od: odResolved.unresolved,
      },
    };
  };

  const cycleVoiceDraftStatus = (rollNo) => {
    setVoiceDraftSelection((prev) => {
      const current = prev[rollNo] || 'P';
      const next = current === 'P' ? 'A' : current === 'A' ? 'O' : 'P';
      const updated = { ...prev };
      if (next === 'P') {
        delete updated[rollNo];
      } else {
        updated[rollNo] = next;
      }
      return updated;
    });
  };

  const focusStudent = (rollNo) => {
    const text = String(rollNo || '').trim();
    if (!text) return;

    setStudentSearchDraft(text);
    setStudentSearch(text);

    setTimeout(() => {
      const node = studentCardRefs.current[text];
      if (node?.scrollIntoView) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
  };

  const applyVoiceResults = () => {
    if (!voiceResult?.parsed) return;

    const absentFiltered = Object.entries(voiceDraftSelection)
      .filter(([, status]) => status === 'A')
      .map(([roll]) => roll);
    const odResolved = Object.entries(voiceDraftSelection)
      .filter(([, status]) => status === 'O')
      .map(([roll]) => roll);

    setAbsentees((prev) => [...new Set([...prev, ...absentFiltered])]);
    setOdList((prev) => [...new Set([...prev, ...odResolved])]);

    const unresolvedCount = (voiceDraftUnresolved.absent || []).length + (voiceDraftUnresolved.od || []).length;
    setVoiceNotice(
      `Applied ${absentFiltered.length} absent and ${odResolved.length} OD${unresolvedCount ? `, ${unresolvedCount} unresolved mention(s)` : ''}.`
    );
    setVoiceResult(null);
    setVoiceDraftSelection({});
    setVoiceDraftUnresolved({ absent: [], od: [] });
    setConfirmationMsg('Voice transcript parsed and applied!');
    setShowConfirmation(true);
  };

  // When subject changes, auto-set section from the assignment and reset attendance state
  React.useEffect(() => {
    const assignedSection = subjects.find(s => s.subject_id === parseInt(selectedSubjectId))?.section || '';
    setSelectedSection(assignedSection);
    setAbsentees([]);
    setOdList([]);
    setStudentSearch('');
    setStudentSearchDraft('');
  }, [selectedSubjectId]);

  // Reset attendance when section changes
  React.useEffect(() => {
    setAbsentees([]);
    setOdList([]);
  }, [selectedSection]);

  if (!subjects?.length) {
    return (
      <div className="panel border-dashed border-border text-center py-10">
        <p className="text-lg font-semibold mb-2">No subjects assigned</p>
        <p className="text-sm text-muted-foreground">Ask the admin to assign your MCA subjects before marking attendance.</p>
      </div>
    );
  }

  const filteredSubjects = subjects.filter(s => {
    const name = s?.name || s?.subject_name || '';
    const code = s?.course_code || '';
    const matchesSearch = name.toLowerCase().includes(subjectSearch.toLowerCase()) || 
                          code.toLowerCase().includes(subjectSearch.toLowerCase());
    const matchesSemester = !semesterFilter || s.semester === parseInt(semesterFilter);
    return matchesSearch && matchesSemester;
  });

  const filteredStudents = React.useMemo(() => {
    const list = Array.isArray(students) ? students : [];
    const query = normalizeText(studentSearch);
    if (!query) return list;

    return list.filter((student) => {
      const roll = String(student.roll_no || '');
      const name = String(student.name || '');
      const rollText = normalizeText(roll);
      const nameText = normalizeText(name);
      return rollText.includes(query) || nameText.includes(query);
    });
  }, [students, studentSearch]);

  const draftAbsentRolls = Object.entries(voiceDraftSelection)
    .filter(([, status]) => status === 'A')
    .map(([roll]) => roll);

  const draftOdRolls = Object.entries(voiceDraftSelection)
    .filter(([, status]) => status === 'O')
    .map(([roll]) => roll);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-[12px] animate-in fade-in duration-300 px-4"
          onClick={() => setShowConfirmation(false)}
        >
          <div 
            className="bg-white/95 dark:bg-slate-900/95 border border-white/20 rounded-[2.5rem] shadow-[0_32px_80px_rgba(0,0,0,0.3)] p-10 max-w-sm w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-500"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-emerald-500/5">
              <CheckCircle2 className="text-emerald-500 animate-in zoom-in scale-110 duration-700 delay-200" size={56} />
            </div>
            
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">All Done!</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed mb-8">
              {confirmationMsg}
            </p>
            
            <button
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
              onClick={() => setShowConfirmation(false)}
            >
              Great, thanks!
            </button>
          </div>
        </div>
      )}
      {/* Edit Attendance Modal */}
      {showEditModal && (
        <EditAttendanceModal
          subjects={subjects}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Today's Summary Toggle + Edit Button row */}
      <div className="flex items-stretch gap-3">
        <div className="panel backdrop-blur-md flex-1">
          <button
            onClick={() => { setShowTodaySummary(v => !v); refetchSummary(); }}
            className="flex items-center justify-between w-full p-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Clock size={16} className="text-indigo-600" />
              </div>
              <div className="text-left">
                <span className="block font-bold text-sm text-slate-800">Today's Attendance Log</span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-tighter">View recently marked periods</span>
              </div>
            </div>
            {showTodaySummary ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
          </button>

        {showTodaySummary && (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            {isSummaryLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-indigo-400" /></div>
            ) : todaySummary?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-border">
                      <th className="text-left p-3 font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                      <th className="text-center p-3 font-bold text-slate-500 uppercase tracking-wider">Period</th>
                      <th className="text-center p-3 font-bold text-emerald-600 uppercase tracking-wider">Present</th>
                      <th className="text-center p-3 font-bold text-rose-600 uppercase tracking-wider">Absent</th>
                      <th className="text-center p-3 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {todaySummary.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <p className="font-bold text-slate-700">{row.subject_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tight">{row.course_code}</p>
                        </td>
                        <td className="text-center font-black text-slate-500">P{row.period}</td>
                        <td className="text-center font-bold text-emerald-500">{row.present_count}</td>
                        <td className="text-center font-bold text-rose-500">{row.absent_count}</td>
                        <td className="text-center p-3">
                          {row.is_substitute ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-100">SUB</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">REG</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center bg-slate-50/50">
                <p className="text-sm text-slate-400">No attendance marked yet for {date}.</p>
              </div>
            )}
          </div>
        )}
        </div>

        {/* Edit Past Attendance Button */}
        <button
          onClick={() => setShowEditModal(true)}
          className="panel flex flex-col items-center justify-center gap-2 px-5 min-w-[100px] hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all group cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
            <History size={16} className="text-indigo-600" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-600 dark:text-slate-300 text-center">Edit Past</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="panel">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Session Details
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Find Subject</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all dark:bg-slate-800/50"
                    />
                  </div>
                  <select
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value)}
                    className="w-20 px-2 py-2 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm appearance-none dark:bg-slate-800/50"
                  >
                    <option value="">Sem</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-4 py-2 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-sm font-medium dark:bg-slate-800/50"
                >
                  {filteredSubjects.map(s => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.course_code} - {s.name || s.subject_name}
                    </option>
                  ))}
                  {filteredSubjects.length === 0 && <option value="">No subjects found</option>}
                </select>
              </div>

              {/* Section Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section</label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Show assigned sections as primary options */}
                  {(availableSections.length > 0 ? availableSections : ['A', 'B']).map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSection(sec)}
                      className={`py-2 rounded-xl border-2 text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${
                        selectedSection === sec
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                          : 'bg-muted/50 border-border text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      Sec {sec}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedSection('')}
                    className={`py-2 rounded-xl border-2 text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${
                      selectedSection === ''
                        ? 'bg-slate-700 border-slate-700 text-white'
                        : 'bg-muted/50 border-border text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    All
                  </button>
                </div>
                {selectedSection && (
                  <p className="text-[10px] text-indigo-500 font-semibold">
                    Showing Section {selectedSection} students only
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Period</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-sm dark:bg-slate-800/50"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(h => (
                      <option key={h} value={h}>Period {h}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm dark:bg-slate-800/50"
                  />
                </div>
              </div>
            </div>

            {isSubstitute && (
              <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-amber-200/50 dark:border-amber-500/20">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900">Substitute Mode Active</p>
                  <p className="text-[10px] text-amber-700/70 leading-relaxed mt-0.5">Recording attendance as substitute faculty.</p>
                </div>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-50">
               <button
                  onClick={handleSubmit}
                  disabled={mutation.isPending || isLoadingStudents || !students}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                  {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Submit Attendance Report
                </button>
                {mutation.isSuccess && (
                  <p className="text-center text-[10px] font-bold text-emerald-500 mt-3 animate-pulse">Report submitted successfully!</p>
                )}
                {error && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 animate-in fade-in zoom-in duration-300">
                    <AlertCircle size={14} />
                    <p className="text-[11px] font-bold">{error}</p>
                  </div>
                )}
            </div>
          </div>

          {/* Voice Marking Panel */}
          <div className="panel relative group overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Mic className="w-4 h-4 text-indigo-600" />
                  Voice Marking
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">Roll Call / Absentee Voice Recording</p>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 px-2 py-1 bg-red-50 rounded-full">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-[9px] font-black text-red-600 uppercase">Recording</span>
                </div>
              )}
            </div>

            {voiceError && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-rose-600 font-medium leading-relaxed">{voiceError}</p>
              </div>
            )}

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={voiceProcessing}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all border-2 ${
                isRecording 
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 scale-[1.02]' 
                  : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 shadow-sm'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isRecording ? 'Stop & Parse Transcript' : 'Start Voice Recording'}
              {voiceProcessing && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
            </button>
            
            {voiceResult && (
               <div 
                ref={reviewRef}
                className="mt-6 p-5 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-xl animate-in zoom-in-95 duration-500"
               >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
                       <span className="px-1.5 py-0.5 bg-indigo-500 text-[9px] font-black rounded text-white">AI PARSE</span>
                    </div>
                    <button
                      onClick={() => {
                        setVoiceResult(null);
                        setVoiceDraftSelection({});
                        setVoiceDraftUnresolved({ absent: [], od: [] });
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-400 italic line-clamp-2">"{voiceResult.transcript}"</p>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Confirm Students (click to cycle P/A/OD)</label>
                      <div className="max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                        {students.map((student) => {
                          const roll = String(student.roll_no);
                          const draftStatus = voiceDraftSelection[roll] || 'P';
                          const style = draftStatus === 'A'
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                            : draftStatus === 'O'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                            : 'bg-slate-900 border-slate-700 text-slate-300';
                          return (
                            <button
                              key={`voice-${roll}`}
                              type="button"
                              onClick={() => cycleVoiceDraftStatus(roll)}
                              className={`text-left rounded-lg border px-2 py-1.5 text-[11px] ${style}`}
                            >
                              <div className="font-bold">{roll}</div>
                              <div className="truncate">{student.name}</div>
                              <div className="text-[10px] font-black mt-0.5">{draftStatus}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {((voiceDraftUnresolved.absent || []).length > 0 || (voiceDraftUnresolved.od || []).length > 0) && (
                      <div className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-[10px] text-slate-300">
                        {(voiceDraftUnresolved.absent || []).length > 0 && (
                          <p>Unresolved absent: {(voiceDraftUnresolved.absent || []).join(', ')}</p>
                        )}
                        {(voiceDraftUnresolved.od || []).length > 0 && (
                          <p>Unresolved OD: {(voiceDraftUnresolved.od || []).join(', ')}</p>
                        )}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {draftAbsentRolls.map(r => (
                        <button
                          key={`abs-${r}`}
                          type="button"
                          onClick={() => focusStudent(r)}
                          className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded text-[10px] font-bold border border-rose-500/20"
                        >
                          ABS: {r}
                        </button>
                      ))}
                      {draftOdRolls.map(r => (
                        <button
                          key={`od-${r}`}
                          type="button"
                          onClick={() => focusStudent(r)}
                          className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold border border-amber-500/20"
                        >
                          OD: {r}
                        </button>
                      ))}
                      {draftAbsentRolls.length === 0 && draftOdRolls.length === 0 && <span className="text-[10px] text-slate-500">No absentees mentioned.</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => applyVoiceResults()}
                    className="w-full py-2.5 mt-4 bg-white text-slate-900 rounded-xl text-[11px] font-black hover:bg-slate-100 transition-colors uppercase tracking-widest active:scale-95"
                  >
                    Confirm & Apply
                  </button>
               </div>
            )}
            {voiceNotice && (
              <p className="mt-3 text-[11px] font-semibold text-indigo-600">{voiceNotice}</p>
            )}
          </div>
        </div>

        {/* Right Column: Roster */}
        <div className="lg:col-span-2 space-y-4">
          <div className="panel min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Student Roster</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                      {students?.length || 0} students
                    </p>
                    {selectedSection ? (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-widest border border-indigo-200">
                        Section {selectedSection}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                        All Sections
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
                <div className="flex-1 flex items-center justify-end sm:justify-start gap-2">
                  <input
                    value={studentSearchDraft}
                    onChange={(e) => {
                      setStudentSearchDraft(e.target.value);
                      setStudentSearch(e.target.value);
                    }}
                    placeholder="Search roll or name"
                    className="w-full sm:w-64 rounded-full border border-border/50 bg-muted/30 py-1.5 px-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />

                  {studentSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setStudentSearch('');
                        setStudentSearchDraft('');
                      }}
                      className="px-2 py-1 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  onClick={markAllPresent}
                  className="px-5 py-2.5 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Reset All Present
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-8 p-4 bg-muted/30 rounded-2xl border border-border text-[10px] font-black uppercase tracking-widest">
              <div className="flex items-center gap-2 text-emerald-600">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> 
                Present
              </div>
              <div className="flex items-center gap-2 text-rose-600">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> 
                Absent
              </div>
              <div className="flex items-center gap-2 text-amber-600">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> 
                On Duty (OD)
              </div>
              <div className="ml-auto text-slate-400 font-bold opacity-50 lowercase tracking-normal">Click to cycle status</div>
            </div>

            {isLoadingStudents ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4 opacity-20" />
                <p className="animate-pulse text-xs uppercase tracking-widest font-black">Syncing Roster...</p>
              </div>
            ) : filteredStudents?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStudents.map(student => {
                  const isAbsent = absentees.includes(student.roll_no);
                  const isOd = odList.includes(student.roll_no);
                  return (
                    <button
                      key={student.roll_no}
                      ref={(node) => {
                        if (node) {
                          studentCardRefs.current[String(student.roll_no)] = node;
                        }
                      }}
                      onClick={() => toggleAttendance(student.roll_no)}
                      className={`group p-4 rounded-2xl border-2 flex flex-col items-start transition-all duration-300 text-left relative overflow-hidden active:scale-95 ${
                         isAbsent 
                          ? 'bg-rose-50 border-rose-200 shadow-sm shadow-rose-100/50' 
                          : isOd
                          ? 'bg-amber-50 border-amber-200 shadow-sm shadow-amber-100/50'
                          : 'bg-background border-border hover:border-emerald-500/30 hover:bg-emerald-500/5 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-tight ${
                          isAbsent ? 'text-rose-500' : isOd ? 'text-amber-500' : 'text-slate-400'
                        }`}>
                          {student.roll_no}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                           {isAbsent ? <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> : isOd ? <Clock className="w-3.5 h-3.5 text-amber-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                      </div>
                      <span className={`text-sm font-bold leading-tight break-words w-full ${
                        isAbsent ? 'text-rose-500 dark:text-rose-400' : isOd ? 'text-amber-500 dark:text-amber-400' : 'text-foreground'
                      }`}>
                        {student.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                <ShieldAlert className="w-16 h-16 mb-6 text-slate-200" />
                <h4 className="text-sm font-black text-slate-600 uppercase tracking-widest">No Matching Student</h4>
                <p className="text-[11px] text-slate-400 mt-2 max-w-[220px]">Try another roll number or name in search, or clear search to view full roster.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
