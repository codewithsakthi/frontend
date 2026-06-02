import React, { useState } from 'react';
import {
  Github, Award, Globe, Terminal, ShieldCheck,
  Sparkles, RefreshCw, Layers, Plus, ExternalLink, HelpCircle, Check, Loader2,
  FileText, Trash2, Calendar, PlusCircle, PencilLine, Linkedin, User, Camera
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../api/client';
import {
  useProfile, useUpsertProfile, useCareerReadiness, useAIInsights, useTriggerAI,
  useGitHubAnalysis, useImportGitHubProjects, useLeetCodeAnalysis, useConnectLeetCode,
  useGitHubCallback, useLinkedInCallback, useUploadResume, useProjects, useCreateProject, useDeleteProject,
  useCertifications, useCreateCertification, useUpdateCertification, useDeleteCertification
} from '../hooks';
import { SkillMatrixChart } from '../components/SkillMatrixChart';
import { CompletionRing } from '../components/CompletionRing';
import { AIInsightPanel } from '../components/AIInsightPanel';
import { CareerReadinessBanner } from '../components/CareerReadinessBanner';
import type { ProfileCreateRequest, PrimaryDomain, ComplexityLevel, CompletionStatus, Certification } from '../types';

const formatMonthValue = (value?: string) => (value ? value.slice(0, 7) : '');
const monthValueToDate = (value?: string) => (value ? `${value}-01` : undefined);
const formatMonthLabel = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
};
const normalizeExternalUrl = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const DOMAINS: { value: PrimaryDomain; label: string; icon: string }[] = [
  { value: 'frontend', label: 'Frontend Dev', icon: '🎨' },
  { value: 'backend', label: 'Backend Dev', icon: '⚙️' },
  { value: 'fullstack', label: 'Full Stack', icon: '🔗' },
  { value: 'data', label: 'Data Analytics', icon: '📊' },
  { value: 'ml', label: 'ML/AI', icon: '🤖' },
  { value: 'devops', label: 'DevOps', icon: '🚀' },
  { value: 'mobile', label: 'Mobile Dev', icon: '📱' },
  { value: 'cybersecurity', label: 'Cybersecurity', icon: '🔐' },
];

export default function ProfessionalProfilePage() {
  const { user, token } = useAuthStore();
  const studentId = user?.student_id || user?.id;

  const { data: profile, isLoading: isProfileLoading, refetch: refetchProfile } = useProfile(studentId!);
  const { data: readiness, refetch: refetchReadiness } = useCareerReadiness(studentId!);
  const { data: insights } = useAIInsights(studentId!);
  const upsert = useUpsertProfile(studentId!);
  const triggerAI = useTriggerAI(studentId!);

  // Extended integrations
  const { data: githubData, isLoading: isGithubLoading, refetch: refetchGithub } = useGitHubAnalysis(studentId!);
  const importGithub = useImportGitHubProjects(studentId!);
  const { data: leetcodeData, isLoading: isLeetcodeLoading, refetch: refetchLeetcode } = useLeetCodeAnalysis(studentId!);
  const connectLeetCode = useConnectLeetCode(studentId!);
  const githubCallback = useGitHubCallback(studentId!);
  const linkedinCallback = useLinkedInCallback(studentId!);
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(false);
  const githubClientId = (import.meta as any).env.VITE_GITHUB_CLIENT_ID as string | undefined;
  const hasGithubOAuth = Boolean(githubClientId);
  const linkedinClientId = (import.meta as any).env.VITE_LINKEDIN_CLIENT_ID as string | undefined;
  const hasLinkedInOAuth = Boolean(linkedinClientId);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileCreateRequest>({});
  const editSectionRef = React.useRef<HTMLDivElement | null>(null);
  const portfolioInputRef = React.useRef<HTMLInputElement | null>(null);
  const [focusPortfolio, setFocusPortfolio] = useState(false);

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const linkedinCode = searchParams.get('linkedin_code');
    if (code) {
      setIsOAuthProcessing(true);
      setSyncStatus('Exchanging OAuth code with GitHub...');

      // Clean query parameters from URL immediately to prevent re-triggering
      const cleanUrl = window.location.pathname + '?tab=Professional';
      window.history.replaceState({}, document.title, cleanUrl);

      githubCallback.mutateAsync(code)
        .then((res) => {
          setSyncStatus(res.message);
          setTimeout(() => {
            setIsOAuthProcessing(false);
            setSyncStatus(null);
            refetchProfile();
            refetchGithub();
            refetchReadiness();
          }, 3000);
        })
        .catch((err) => {
          setSyncStatus(`OAuth Error: ${err.message || 'Authentication failed'}`);
          setTimeout(() => {
            setIsOAuthProcessing(false);
            setSyncStatus(null);
          }, 4000);
        });
    } else if (linkedinCode) {
      setIsOAuthProcessing(true);
      setSyncStatus('Connecting LinkedIn...');

      const cleanUrl = window.location.pathname + '?tab=Professional';
      window.history.replaceState({}, document.title, cleanUrl);

      linkedinCallback.mutateAsync(linkedinCode)
        .then((res) => {
          setSyncStatus(res.message);
          setTimeout(() => {
            setIsOAuthProcessing(false);
            setSyncStatus(null);
            refetchProfile();
            refetchReadiness();
          }, 3000);
        })
        .catch((err) => {
          setSyncStatus(`LinkedIn Error: ${err.message || 'Authentication failed'}`);
          setTimeout(() => {
            setIsOAuthProcessing(false);
            setSyncStatus(null);
          }, 4000);
        });
    }
  }, []);

  React.useEffect(() => {
    if (!editing) return;
    editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focusPortfolio) {
      portfolioInputRef.current?.focus();
      setFocusPortfolio(false);
    }
  }, [editing, focusPortfolio]);

  // Modals state
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [showLinkedinModal, setShowLinkedinModal] = useState(false);
  const [showLeetcodeModal, setShowLeetcodeModal] = useState(false);
  const [githubInput, setGithubInput] = useState('');
  const [linkedinInput, setLinkedinInput] = useState('');
  const [leetcodeInput, setLeetcodeInput] = useState('');

  // Status logs for connectors
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [linkedinImgError, setLinkedinImgError] = useState(false);
  const [liPicUrl, setLiPicUrl] = useState<string | null>(null);

  React.useEffect(() => {
    setLinkedinImgError(false);
    setLiPicUrl(null);
  }, [profile?.picture_url]);

  const [pictureError, setPictureError] = useState(false);
  const [pictureTimestamp, setPictureTimestamp] = useState(Date.now());
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [pictureUploading, setPictureUploading] = useState(false);
  const baseUrl = (api as any).defaults.baseURL as string;
  const profilePictureUrl = (studentId && (profile?.picture_url || profile?.github_username))
    ? `${baseUrl}/professional/profile/${studentId}/picture?t=${pictureTimestamp}`
    : '';

  React.useEffect(() => {
    setPictureError(false);
    setPictureTimestamp(Date.now());
  }, [profile?.picture_url, profile?.student_id, profile?.github_username]);

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size exceeds 5MB limit.");
      return;
    }

    setPictureUploading(true);
    setUploadStatus('Uploading profile picture...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const baseUrl = (api as any).defaults.baseURL as string;
      const resp = await fetch(`${baseUrl}/professional/profile/upload-picture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(msg || `Failed to upload picture (${resp.status})`);
      }

      setPictureError(false);
      setPictureTimestamp(Date.now());
      refetchProfile();
      setUploadStatus('Profile picture updated successfully!');
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Error'}`);
      setUploadStatus(null);
    } finally {
      setPictureUploading(false);
    }
  };

  const handleUseGithubPhoto = async () => {
    if (!profile?.github_username) {
      alert("Please connect your GitHub account first.");
      return;
    }
    setUploadStatus('Syncing GitHub profile picture...');
    try {
      const githubUrl = `https://github.com/${profile.github_username}.png`;
      await upsert.mutateAsync({
        ...form,
        github_username: profile.github_username,
        picture_url: githubUrl
      });
      setPictureError(false);
      setPictureTimestamp(Date.now());
      refetchProfile();
      setUploadStatus('Profile picture updated to GitHub photo!');
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (err: any) {
      alert(`Failed to set GitHub photo: ${err.message}`);
      setUploadStatus(null);
    }
  };

  React.useEffect(() => {
    if (profile?.linkedin_cache_data && token) {
      const baseUrl = (api as any).defaults.baseURL as string;
      fetch(`${baseUrl}/professional/profile/linkedin-picture`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => {
          if (!r.ok) throw new Error("Failed to fetch LinkedIn picture");
          return r.blob();
        })
        .then(blob => setLiPicUrl(URL.createObjectURL(blob)))
        .catch(() => setLiPicUrl(null));
    } else {
      setLiPicUrl(null);
    }
  }, [profile?.linkedin_cache_data, token]);

  // Resume Upload State & Mutation
  const uploadResumeMutation = useUploadResume(studentId!);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('Uploading resume...');
    try {
      await uploadResumeMutation.mutateAsync(file);
      setUploadStatus('Resume uploaded successfully and AI analysis queued!');
      setTimeout(() => setUploadStatus(null), 3000);
      refetchProfile();
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message || 'Error'}`);
      setTimeout(() => setUploadStatus(null), 4000);
    }
  };

  const handleViewResume = async () => {
    if (!token) {
      setUploadStatus('You are not authenticated. Please sign in again.');
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    setUploadStatus('Opening uploaded resume...');
    try {
      const baseUrl = (api as any).defaults.baseURL as string;
      const resp = await fetch(`${baseUrl}/professional/resume/download`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(msg || `Failed to fetch resume (${resp.status})`);
      }

      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      // Use anchor tag fallback to work seamlessly inside standalone PWA containers on mobile
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = profile?.resume_file_path?.split('/').pop() || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setUploadStatus(null);
    } catch (err: any) {
      setUploadStatus(`Unable to open resume: ${err?.message || 'Unknown error'}`);
      setTimeout(() => setUploadStatus(null), 4000);
    }
  };

  const handleOpenCertificationUrl = (url?: string) => {
    const resolvedUrl = normalizeExternalUrl(url);
    if (!resolvedUrl) return;
    window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
  };

  // Projects State & Mutations
  const { data: projects, refetch: refetchProjects } = useProjects(studentId!);
  const createProjectMutation = useCreateProject(studentId!);
  const deleteProjectMutation = useDeleteProject(studentId!);
  
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    tech_stack: '',
    github_url: '',
    role: 'Lead Developer',
    complexity_level: 'intermediate',
    completion_status: 'completed'
  });

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tech = newProject.tech_stack.split(',').map(t => t.trim()).filter(Boolean);
      await createProjectMutation.mutateAsync({
        title: newProject.title,
        description: newProject.description || undefined,
        tech_stack: tech,
        github_url: newProject.github_url || undefined,
        role: newProject.role || undefined,
        complexity_level: newProject.complexity_level as ComplexityLevel,
        completion_status: newProject.completion_status as CompletionStatus
      });
      setShowAddProjectModal(false);
      setNewProject({
        title: '',
        description: '',
        tech_stack: '',
        github_url: '',
        role: 'Lead Developer',
        complexity_level: 'intermediate',
        completion_status: 'completed'
      });
      refetchProjects();
      refetchProfile();
      refetchReadiness();
    } catch (err: any) {
      alert(`Failed to add project: ${err.message}`);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProjectMutation.mutateAsync(projectId);
      refetchProjects();
      refetchProfile();
      refetchReadiness();
    } catch (err: any) {
      alert(`Failed to delete project: ${err.message}`);
    }
  };

  // Certifications State & Mutations
  const { data: certifications, refetch: refetchCerts } = useCertifications(studentId!);
  const createCertMutation = useCreateCertification(studentId!);
  const updateCertMutation = useUpdateCertification(studentId!);
  const deleteCertMutation = useDeleteCertification(studentId!);

  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [editingCertId, setEditingCertId] = useState<number | null>(null);
  const [newCert, setNewCert] = useState({
    title: '',
    provider: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    credential_url: '',
  });

  const openCertModal = (cert?: Certification) => {
    if (cert) {
      setEditingCertId(cert.certification_id);
      setNewCert({
        title: cert.title || '',
        provider: cert.provider || '',
        issue_date: formatMonthValue(cert.issue_date),
        expiry_date: formatMonthValue(cert.expiry_date),
        credential_id: cert.credential_id || '',
        credential_url: cert.credential_url || '',
      });
    } else {
      setEditingCertId(null);
      setNewCert({
        title: '',
        provider: '',
        issue_date: '',
        expiry_date: '',
        credential_id: '',
        credential_url: '',
      });
    }
    setShowAddCertModal(true);
  };

  const handleSubmitCert = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: newCert.title.trim(),
      provider: newCert.provider.trim() || undefined,
      issue_date: monthValueToDate(newCert.issue_date),
      expiry_date: monthValueToDate(newCert.expiry_date),
      credential_id: newCert.credential_id.trim() || undefined,
      credential_url: normalizeExternalUrl(newCert.credential_url) || undefined,
    };

    try {
      if (editingCertId) {
        await updateCertMutation.mutateAsync({ certId: editingCertId, data: payload });
      } else {
        await createCertMutation.mutateAsync(payload);
      }
      setShowAddCertModal(false);
      setEditingCertId(null);
      setNewCert({
        title: '',
        provider: '',
        issue_date: '',
        expiry_date: '',
        credential_id: '',
        credential_url: '',
      });
      refetchCerts();
      refetchProfile();
      refetchReadiness();
    } catch (err: any) {
      alert(`Failed to ${editingCertId ? 'update' : 'add'} certification: ${err.message}`);
    }
  };

  const handleDeleteCert = async (certId: number) => {
    if (!confirm('Are you sure you want to delete this certification?')) return;
    try {
      await deleteCertMutation.mutateAsync(certId);
      refetchCerts();
      refetchProfile();
      refetchReadiness();
    } catch (err: any) {
      alert(`Failed to delete certification: ${err.message}`);
    }
  };

  React.useEffect(() => {
    if (profile) {
      setForm({
        github_username: profile.github_username,
        portfolio_url: profile.portfolio_url,
        linkedin_url: profile.linkedin_url,
        picture_url: profile.picture_url,
        leetcode_username: profile.leetcode_username,
        hackerrank_username: profile.hackerrank_username,
        codechef_username: profile.codechef_username,
        primary_domain: profile.primary_domain,
        bio: profile.bio,
        career_interest: profile.career_interest,
        is_public: profile.is_public ?? true,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    await upsert.mutateAsync(form);
    setEditing(false);
  };

  const handleConnectGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubInput.trim()) return;
    setSyncStatus('Connecting GitHub account...');
    try {
      // Set picture_url to GitHub avatar if we don't have one
      const githubUrl = `https://github.com/${githubInput.trim()}.png`;
      const pictureUrl = form.picture_url || profile?.picture_url || githubUrl;

      await upsert.mutateAsync({ ...form, github_username: githubInput.trim(), picture_url: pictureUrl });
      await refetchGithub();
      setSyncStatus('GitHub Connected! Automatically importing public repositories as projects...');
      const res = await importGithub.mutateAsync();
      setSyncStatus(res.message);
      setTimeout(() => {
        setSyncStatus(null);
        setShowGithubModal(false);
        refetchProfile();
        refetchReadiness();
      }, 3000);
    } catch (err: any) {
      setSyncStatus(`Error: ${err.message || 'Failed to connect GitHub'}`);
    }
  };

  const handleConnectLinkedIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinInput.trim()) return;
    setSyncStatus('Connecting LinkedIn profile...');
    try {
      // Robust parsed & normalized LinkedIn URL
      const clean = linkedinInput.trim();
      let normalizedUrl = '';
      const match = clean.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9\-_%]+)/i);
      if (match && match[1]) {
        normalizedUrl = `https://www.linkedin.com/in/${match[1]}/`;
      } else {
        normalizedUrl = `https://www.linkedin.com/in/${clean.replace(/^\/+|\/+$/g, '')}/`;
      }

      // Infer social avatar from connected GitHub as fallback if no picture exists
      let pictureUrl = form.picture_url || profile?.picture_url;
      if (!pictureUrl && (form.github_username || profile?.github_username)) {
        pictureUrl = `https://github.com/${form.github_username || profile?.github_username}.png`;
      }

      await upsert.mutateAsync({ 
        ...form, 
        linkedin_url: normalizedUrl, 
        picture_url: pictureUrl || undefined 
      });
      setSyncStatus('LinkedIn connected successfully!');
      setTimeout(() => {
        setSyncStatus(null);
        setShowLinkedinModal(false);
        setLinkedinInput('');
        refetchProfile();
        refetchReadiness();
      }, 1500);
    } catch (err: any) {
      setSyncStatus(`Error: ${err.message || 'Failed to connect LinkedIn'}`);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleDisconnectLinkedIn = async () => {
    if (!confirm('Are you sure you want to disconnect your LinkedIn profile?')) return;
    setSyncStatus('Disconnecting LinkedIn profile...');
    try {
      await upsert.mutateAsync({ 
        ...form, 
        linkedin_url: '', 
        picture_url: '' 
      });
      setSyncStatus('LinkedIn disconnected successfully!');
      setTimeout(() => {
        setSyncStatus(null);
        refetchProfile();
        refetchReadiness();
      }, 1500);
    } catch (err: any) {
      setSyncStatus(`Error: ${err.message || 'Failed to disconnect LinkedIn'}`);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const handleGithubOAuthRedirect = () => {
    if (!githubClientId) return;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&scope=read:user,repo&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const handleLinkedInOAuthRedirect = () => {
    if (!linkedinClientId) return;
    const redirectUri = `${window.location.origin}/auth/linkedin/callback`;
    const scopes = 'openid profile email';
    window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedinClientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const handleConnectLeetcode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leetcodeInput.trim()) return;
    setSyncStatus('Connecting LeetCode account...');
    try {
      await connectLeetCode.mutateAsync(leetcodeInput.trim());
      setSyncStatus('LeetCode account successfully connected and coding stats cached!');
      setTimeout(() => {
        setSyncStatus(null);
        setShowLeetcodeModal(false);
        refetchLeetcode();
        refetchProfile();
        refetchReadiness();
      }, 3000);
    } catch (err: any) {
      setSyncStatus(`Error: ${err.message || 'Failed to connect LeetCode'}`);
    }
  };


  const handleImportRepos = async () => {
    setSyncStatus('Importing repositories...');
    try {
      const res = await importGithub.mutateAsync();
      alert(res.message);
      setSyncStatus(null);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
      setSyncStatus(null);
    }
  };

  const completion = profile?.profile_completion_score ?? 0;

  return (
    <div className="spics-page space-y-6">
      {/* OAuth Sync Overlay */}
      {isOAuthProcessing && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-300">
          <div className="text-center space-y-6 max-w-md w-full p-6 sm:p-8 glass rounded-[2rem] sm:rounded-[2.5rem] border border-primary/20 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />

            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center mx-auto shadow-lg shadow-primary/20 animate-pulse">
                <Github size={40} className="text-primary-foreground animate-bounce" />
              </div>
              <div className="absolute top-0 right-[35%] w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Syncing Developer DNA
              </h2>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest animate-pulse">
                {syncStatus || 'Exchanging OAuth code...'}
              </p>
            </div>

            <div className="p-4 bg-muted/30 rounded-2xl border border-border flex items-center justify-center gap-3 text-xs font-semibold text-muted-foreground">
              <Loader2 className="animate-spin text-primary" size={16} />
              <span>Fetching profile, repositories & star counts</span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="spics-hero flex flex-col md:flex-row items-center justify-between gap-6 glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 card-premium relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="flex flex-col md:flex-row items-center gap-6 z-10">
          <div className="relative group w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-primary to-accent text-primary-foreground flex items-center justify-center text-4xl font-black shadow-xl overflow-hidden">
            {liPicUrl ? (
              <img src={liPicUrl} alt="" className="h-full w-full object-cover" onError={() => { setLiPicUrl(null); setLinkedinImgError(true); }} />
            ) : profilePictureUrl && !pictureError ? (
              <img src={profilePictureUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" onError={() => setPictureError(true)} />
            ) : (
              user?.name?.[0]?.toUpperCase() ?? '?'
            )}

            {/* Upload Camera Overlay */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white z-20"
            >
              <Camera size={20} className="mb-0.5 animate-bounce" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Upload</span>
            </div>

            {pictureUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
                <Loader2 className="animate-spin text-white" size={24} />
              </div>
            )}
          </div>
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handlePictureUpload}
          />
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tight">{user?.name ?? 'Student'}</h1>
            <p className="text-sm font-semibold text-primary/80 mt-1 uppercase tracking-widest">
              {profile?.primary_domain
                ? DOMAINS.find(d => d.value === profile.primary_domain)?.icon + ' ' +
                DOMAINS.find(d => d.value === profile.primary_domain)?.label
                : 'Primary Domain Not Configured'}
            </p>
            {profile?.bio && <p className="text-sm text-muted-foreground/80 mt-3 max-w-xl italic">"{profile.bio}"</p>}
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end gap-4 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <CompletionRing score={completion} />
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profile Complete</p>
              <p className="text-2xl font-black text-foreground">{completion}%</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 text-center justify-center flex items-center"
              >
                ✏️ {profile ? 'Edit Profile' : 'Create Profile'}
              </button>
            )}
            {!editing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs uppercase tracking-widest transition-all text-center justify-center flex items-center gap-1.5 hover:scale-105"
              >
                <Camera size={14} /> Upload Photo
              </button>
            )}
            {profile?.github_username && !editing && (
              <button
                onClick={handleUseGithubPhoto}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs uppercase tracking-widest transition-all text-center justify-center flex items-center gap-1.5 hover:scale-105"
              >
                <Github size={14} /> Use GitHub Photo
              </button>
            )}
            {insights?.ai_status !== 'processing' && (
              <button
                onClick={() => triggerAI.mutate()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs uppercase tracking-widest transition-all text-center justify-center flex items-center"
              >
                🤖 Refine Career DNA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Career Readiness Banner */}
      {readiness && <CareerReadinessBanner readiness={readiness} />}

      {/* Edit Form */}
      {editing && (
        <div ref={editSectionRef} className="glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 card-premium animate-in zoom-in-95 duration-200">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">✍️ Edit Professional Profile</h2>

          {/* Domain Selector */}
          <div className="mb-6">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Primary Domain Focus</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {DOMAINS.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, primary_domain: d.value }))}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border text-sm font-semibold transition-all ${form.primary_domain === d.value
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                      : 'border-border bg-card/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <span>{d.icon}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Professional Bio Summary</label>
              <textarea
                className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all text-sm font-medium"
                placeholder="Write a compelling 2-3 sentence professional summary..."
                value={form.bio ?? ''}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
                maxLength={1000}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Portfolio Website</label>
              <input
                ref={portfolioInputRef}
                className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all text-sm font-medium"
                placeholder="https://yoursite.com"
                value={form.portfolio_url ?? ''}
                onChange={e => setForm(f => ({ ...f, portfolio_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">LinkedIn Profile URL</label>
              <input
                className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all text-sm font-medium"
                placeholder="https://linkedin.com/in/yourusername"
                value={form.linkedin_url ?? ''}
                onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">HackerRank Username</label>
              <input
                className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all text-sm font-medium"
                placeholder="hackerrank_username"
                value={form.hackerrank_username ?? ''}
                onChange={e => setForm(f => ({ ...f, hackerrank_username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">CodeChef Username</label>
              <input
                className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all text-sm font-medium"
                placeholder="codechef_username"
                value={form.codechef_username ?? ''}
                onChange={e => setForm(f => ({ ...f, codechef_username: e.target.value }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2 p-4 bg-muted/20 rounded-2xl border border-border mt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent overflow-hidden flex items-center justify-center text-2xl font-black text-white shadow flex-shrink-0 relative group">
                  {profilePictureUrl && !pictureError ? (
                    <img src={profilePictureUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() ?? '?'
                  )}
                  {pictureUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={16} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold">Profile Portrait Photo</p>
                  <p className="text-xs text-muted-foreground">Upload a custom professional picture or sync with GitHub.</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow"
                >
                  <Camera size={12} className="inline mr-1" /> Upload
                </button>
                {profile?.github_username && (
                  <button
                    type="button"
                    onClick={handleUseGithubPhoto}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    <Github size={12} className="inline mr-1" /> Use GitHub
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border mt-4">
              <div>
                <p className="text-sm font-bold">Public Directory Visibility</p>
                <p className="text-xs text-muted-foreground">Make your profile discoverable for faculty and recruiters.</p>
              </div>
              <input
                type="checkbox"
                className="w-5 h-5 accent-primary cursor-pointer"
                checked={form.is_public ?? true}
                onChange={e => setForm(f => ({ ...f, is_public: e.target.checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={upsert.isPending}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/25"
            >
              {upsert.isPending ? '⏳ Saving...' : '💾 Save Profile'}
            </button>
          </div>
        </div>
      )}

      {/* CONNECTORS GRID (GitHub, LinkedIn, LeetCode) */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* GitHub Connector */}
        <div className="glass rounded-[2rem] p-6 border border-border flex flex-col justify-between card-premium bg-gradient-to-b from-[#1b1f23]/10 to-transparent">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-[#24292e]/10 text-foreground">
                <Github size={28} />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${profile?.github_username
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-muted text-muted-foreground'
                }`}>
                {profile?.github_username ? 'CONNECTED' : 'PENDING'}
              </span>
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">GitHub Connect</h3>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Synchronize repositories automatically to populate your academic projects.
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-border/40">
            {profile?.github_username ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Linked Account</span>
                  <a
                    href={`https://github.com/${profile.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    @{profile.github_username} <ExternalLink size={12} />
                  </a>
                </div>
                {githubData && !githubData.error ? (
                  <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-black/10 border border-border/20">
                      <p className="font-black text-base">{githubData.public_repos}</p>
                      <p className="text-[10px] text-muted-foreground">Repos</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/10 border border-border/20">
                      <p className="font-black text-base">{githubData.total_stars}</p>
                      <p className="text-[10px] text-muted-foreground">Stars</p>
                    </div>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <button
                    onClick={handleImportRepos}
                    className="flex-1 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-[10px] uppercase tracking-wider hover:bg-primary/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={12} /> Auto Import Repos
                  </button>
                  <button
                    onClick={() => setShowGithubModal(true)}
                    className="px-3 py-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-all flex items-center justify-center"
                    title="Change Account"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowGithubModal(true)}
                className="w-full py-3 rounded-xl bg-[#24292e] text-white font-black text-xs uppercase tracking-widest hover:scale-102 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#24292e]/25"
              >
                <Github size={16} /> Link GitHub Profile
              </button>
            )}
          </div>
        </div>

        {/* LeetCode Connector */}
        <div className="glass rounded-[2rem] p-6 border border-border flex flex-col justify-between card-premium bg-gradient-to-b from-[#ffa116]/10 to-transparent">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-[#ffa116]/10 text-[#ffa116]">
                <Award size={28} />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${profile?.leetcode_username
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-muted text-muted-foreground'
                }`}>
                {profile?.leetcode_username ? 'CONNECTED' : 'PENDING'}
              </span>
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">LeetCode Connect</h3>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Synchronize coding statistics and problems solved metrics to enhance capability scores.
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-border/40">
            {profile?.leetcode_username ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Coding Profile</span>
                  <a
                    href={`https://leetcode.com/${profile.leetcode_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold flex items-center gap-1 hover:text-[#ffa116] transition-colors"
                  >
                    @{profile.leetcode_username} <ExternalLink size={12} />
                  </a>
                </div>
                {leetcodeData ? (
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs pt-1">
                    <div className="p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <p className="font-black text-emerald-500 text-sm">{leetcodeData.easy_solved}</p>
                      <p className="text-[9px] text-muted-foreground">Easy</p>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <p className="font-black text-amber-500 text-sm">{leetcodeData.medium_solved}</p>
                      <p className="text-[9px] text-muted-foreground">Medium</p>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                      <p className="font-black text-rose-500 text-sm">{leetcodeData.hard_solved}</p>
                      <p className="text-[9px] text-muted-foreground">Hard</p>
                    </div>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <div className="p-2.5 rounded-xl bg-black/10 border border-border/20 text-[10px] font-bold text-center flex-1">
                    Total: <span className="font-black text-foreground text-xs">{leetcodeData?.total_solved ?? 0}</span> Solved
                  </div>
                  <button
                    onClick={() => setShowLeetcodeModal(true)}
                    className="px-3 py-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-all flex items-center justify-center"
                    title="Change LeetCode Account"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowLeetcodeModal(true)}
                className="w-full py-3 rounded-xl bg-[#ffa116] text-[#1b1b1b] font-black text-xs uppercase tracking-widest hover:scale-102 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ffa116]/25"
              >
                <Award size={16} /> Link LeetCode Profile
              </button>
            )}
          </div>
        </div>

        {/* LinkedIn Connector */}
        <div className="glass rounded-[2rem] p-6 border border-border flex flex-col justify-between card-premium bg-gradient-to-b from-[#0a66c2]/10 to-transparent">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-[#0a66c2]/10 text-[#0a66c2]">
                <Linkedin size={28} />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${profile?.linkedin_url
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-muted text-muted-foreground'
                }`}>
                {profile?.linkedin_url ? 'CONNECTED' : 'PENDING'}
              </span>
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">LinkedIn Connect</h3>
            <p className="text-xs text-muted-foreground/80 mt-1">
              Link your LinkedIn profile to showcase your professional network and verified credentials.
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-border/40">
            {profile?.linkedin_url ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-[#0a66c2]/10 border border-[#0a66c2]/20 flex items-center justify-center flex-shrink-0">
                    {liPicUrl ? (
                      <img src={liPicUrl} alt="LinkedIn Profile" className="h-full w-full object-cover animate-in fade-in duration-300" />
                    ) : profilePictureUrl && !linkedinImgError ? (
                      <img 
                        src={profilePictureUrl} 
                        alt="LinkedIn Profile" 
                        className="h-full w-full object-cover animate-in fade-in duration-300" 
                        onError={() => setLinkedinImgError(true)}
                      />
                    ) : (
                      <span className="text-[#0a66c2] font-black text-sm uppercase">
                        {profile.linkedin_url.replace('https://www.linkedin.com/in/', '').charAt(0) || 'L'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Profile</p>
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-extrabold text-xs flex items-center gap-1 hover:text-[#0a66c2] transition-colors truncate"
                    >
                      {profile.linkedin_url.replace('https://www.linkedin.com/in/', '').replace(/\/$/, '')} <ExternalLink size={10} className="flex-shrink-0" />
                    </a>
                    {profile.linkedin_url.includes('ZLobRxQJca') && (
                      <p className="text-[10px] text-amber-500 font-semibold mt-1 leading-normal">
                        ⚠️ LinkedIn returned your private security ID (hash) instead of your public handle. Click <strong>Switch Account</strong> below and enter your clean username (e.g. <code>codewithsakthi</code>) to make the link work!
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setLinkedinInput(profile.linkedin_url || '');
                      setShowLinkedinModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#0a66c2]/10 border border-[#0a66c2]/20 text-[#0a66c2] hover:bg-[#0a66c2]/20 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={12} /> Switch Account
                  </button>
                  <button
                    onClick={handleDisconnectLinkedIn}
                    className="px-3 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 transition-all flex items-center justify-center"
                    title="Disconnect LinkedIn Account"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowLinkedinModal(true)}
                className="w-full py-3 rounded-xl bg-[#0a66c2] text-white font-black text-xs uppercase tracking-widest hover:scale-102 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0a66c2]/25"
              >
                <Linkedin size={16} /> Link LinkedIn Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights Panel */}
      {insights && <AIInsightPanel insights={insights} />}

      {/* DEVELOPER ASSETS: PORTFOLIO & RESUME */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Portfolio URL Card */}
        <div className="glass rounded-[2rem] p-6 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-premium bg-gradient-to-b from-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary">
              <Globe size={28} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Portfolio Showcase</h4>
              {profile?.portfolio_url ? (
                <a 
                  href={profile.portfolio_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-lg font-black text-foreground hover:text-primary transition-colors flex items-center gap-1.5 mt-1"
                >
                  Visit Portfolio <ExternalLink size={14} />
                </a>
              ) : (
                <p className="text-sm font-bold text-muted-foreground mt-1">No portfolio website linked.</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => {
              setFocusPortfolio(true);
              setEditing(true);
            }}
            className="p-3 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-all flex items-center gap-1 text-xs font-bold"
          >
            <PlusCircle size={14} /> {profile?.portfolio_url ? 'Change' : 'Add Link'}
          </button>
        </div>

        {/* Resume Uploader Card */}
        <div className="glass rounded-[2rem] p-6 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-premium bg-gradient-to-b from-accent/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-accent/10 text-accent">
              <FileText size={28} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Professional Resume</h4>
              {profile?.resume_file_path ? (
                <div className="mt-1">
                  <p className="text-xs font-black text-foreground truncate max-w-[200px]">
                    📄 {profile.resume_file_path.split('/').pop() || 'resume.pdf'}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                    Uploaded: {profile.resume_uploaded_at ? new Date(profile.resume_uploaded_at).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-bold text-muted-foreground mt-1">No resume uploaded yet.</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {profile?.resume_file_path ? (
              <button
                onClick={handleViewResume}
                className="p-3 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-all flex items-center gap-1 text-xs font-bold"
                title="View uploaded resume"
                type="button"
              >
                <ExternalLink size={14} />
                <span>View</span>
              </button>
            ) : null}

            <label className="p-3 rounded-xl border border-border hover:bg-muted text-muted-foreground transition-all flex items-center gap-1 text-xs font-bold cursor-pointer">
              <PlusCircle size={14} /> 
              <span>{profile?.resume_file_path ? 'Re-upload' : 'Upload PDF'}</span>
              <input 
                type="file" 
                accept=".pdf,.docx" 
                className="hidden" 
                onChange={handleResumeUpload} 
                disabled={uploadResumeMutation.isPending} 
              />
            </label>
          </div>
        </div>
      </div>

      {uploadStatus && (
        <div className="p-4 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-2xl text-center animate-pulse">
          {uploadStatus}
        </div>
      )}

      {/* DETAILED PROJECTS & CREDENTIALS ROW */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Projects Catalog */}
        <div className="glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 card-premium flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  <Terminal size={20} className="text-primary" /> Academic Projects
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Synchronized from GitHub or entered manually.</p>
              </div>
              <button 
                onClick={() => setShowAddProjectModal(true)}
                className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-md flex items-center gap-1"
              >
                <Plus size={14} /> Add Project
              </button>
            </div>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {projects && projects.length > 0 ? (
                projects.map((proj) => (
                  <div key={proj.project_id} className="p-4 rounded-2xl border border-border bg-card/40 flex flex-col justify-between gap-3 hover:border-primary/30 transition-all relative group">
                    <button 
                      onClick={() => handleDeleteProject(proj.project_id)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg border border-border hover:bg-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Project"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-foreground">{proj.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          proj.verification_status === 'verified' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : proj.verification_status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {proj.verification_status || 'pending'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{proj.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-wrap gap-1">
                        {proj.tech_stack && proj.tech_stack.map((tech) => (
                          <span key={tech} className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                            {tech}
                          </span>
                        ))}
                      </div>
                      {proj.github_url && (
                        <a 
                          href={proj.github_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Github size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-3xl">
                  <Terminal size={32} className="mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">No projects mapped yet.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Connect GitHub or add a custom project manually.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Certifications Catalog */}
        <div className="glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 card-premium flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  <Award size={20} className="text-[#0a66c2]" /> Industry Certifications
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Imported from LinkedIn or recorded manually.</p>
              </div>
              <button 
                onClick={() => openCertModal()}
                className="px-3.5 py-2 rounded-xl bg-[#0a66c2] text-white font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-md flex items-center gap-1"
                type="button"
              >
                <Plus size={14} /> Add Cert
              </button>
            </div>

            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {certifications && certifications.length > 0 ? (
                certifications.map((cert) => (
                  <div key={cert.certification_id} className="p-4 rounded-2xl border border-border bg-card/40 flex flex-col justify-between gap-2 hover:border-[#0a66c2]/30 transition-all relative group">
                    <button 
                      onClick={() => openCertModal(cert)}
                      className="absolute top-4 right-11 p-1.5 rounded-lg border border-border hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit Certification"
                      type="button"
                    >
                      <PencilLine size={12} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCert(cert.certification_id)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg border border-border hover:bg-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete Certification"
                      type="button"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground">{cert.title}</h4>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">{cert.provider}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground font-semibold">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> Issued: {formatMonthLabel(cert.issue_date)}
                      </span>
                      {cert.credential_url && (
                        <button
                          type="button"
                          onClick={() => handleOpenCertificationUrl(cert.credential_url)}
                          className="text-[#0a66c2] font-bold hover:underline flex items-center gap-0.5 text-left"
                          title={normalizeExternalUrl(cert.credential_url)}
                        >
                          Verify <ExternalLink size={10} />
                        </button>
                      )}
                    </div>
                    {cert.credential_url && (
                      <p className="text-[9px] text-muted-foreground break-all">
                        {normalizeExternalUrl(cert.credential_url)}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-3xl">
                  <Award size={32} className="mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">No certifications listed yet.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Connect LinkedIn or record your credentials manually.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED STATS ROW (if github/leetcode connected) */}
      {(githubData || leetcodeData) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* GitHub detailed panel */}
          {githubData && !githubData.error && (
            <div className="glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 card-premium flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight mb-2 flex items-center gap-2">
                  <Github size={20} className="text-primary" /> GitHub Developer DNA
                </h3>
                <p className="text-xs text-muted-foreground mb-6">Language breakdown and repository footprints.</p>

                {/* Languages breakdown */}
                {githubData.top_languages && (
                  <div className="space-y-3 mb-6">
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Top Programming Languages</p>
                    <div className="space-y-2">
                      {Object.entries(githubData.top_languages).slice(0, 4).map(([lang, count], idx) => {
                        const total = Object.values(githubData.top_languages).reduce((a, b) => (a as number) + (b as number), 0) as number;
                        const pct = Math.round((count as number / total) * 100);
                        const colors = ['bg-[#6366f1]', 'bg-[#ec4899]', 'bg-[#10b981]', 'bg-[#f59e0b]'];
                        return (
                          <div key={lang}>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>{lang}</span>
                              <span className="text-muted-foreground">{pct}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${colors[idx % colors.length]}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Popular Repos */}
                {githubData.top_repos && (
                  <div className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Top Repositories</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {githubData.top_repos.slice(0, 4).map((repo: any) => (
                        <a
                          key={repo.name}
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl border border-border bg-card/40 hover:bg-muted/40 transition-all flex flex-col justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-bold truncate text-foreground">{repo.name}</p>
                            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">{repo.description || 'No description provided.'}</p>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                            <span>{repo.language || 'Code'}</span>
                            <span className="flex items-center gap-0.5">⭐ {repo.stars}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LeetCode detailed stats panel */}
          {leetcodeData && (
            <div className="glass rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 card-premium flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight mb-2 flex items-center gap-2">
                  <Award size={20} className="text-[#ffa116]" /> LeetCode Solution Breakdown
                </h3>
                <p className="text-xs text-muted-foreground mb-6">Coding test scores and algorithm resolution stats.</p>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-6">
                  <div className="p-2 sm:p-4 rounded-2xl bg-[#ffa116]/5 border border-[#ffa116]/10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ranking</p>
                    <p className="text-xs sm:text-lg font-black text-[#ffa116] mt-2">#{leetcodeData.ranking?.toLocaleString()}</p>
                  </div>
                  <div className="p-2 sm:p-4 rounded-2xl bg-primary/5 border border-primary/10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Acceptance</p>
                    <p className="text-xs sm:text-lg font-black text-primary mt-2">{leetcodeData.acceptance_rate}%</p>
                  </div>
                  <div className="p-2 sm:p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Points</p>
                    <p className="text-xs sm:text-lg font-black text-emerald-500 mt-2">{leetcodeData.contribution_points}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-500">Easy Solved</span>
                      <span className="text-muted-foreground">{leetcodeData.easy_solved} solved</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min((leetcodeData.easy_solved / 250) * 100, 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-amber-500">Medium Solved</span>
                      <span className="text-muted-foreground">{leetcodeData.medium_solved} solved</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min((leetcodeData.medium_solved / 200) * 100, 100)}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-rose-500">Hard Solved</span>
                      <span className="text-muted-foreground">{leetcodeData.hard_solved} solved</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min((leetcodeData.hard_solved / 50) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GITHUB CONNECT MODAL */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowGithubModal(false)} />
          <div className="glass max-w-md w-full relative z-10 p-8 rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 card-premium">
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <Github size={24} className="text-foreground" /> Connect GitHub Profile
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Link your profile to synchronize public repositories as academic projects and build your Developer DNA.
            </p>

            <div className="space-y-4">
              {/* Method A: Premium OAuth */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-2">Method 1: Secure OAuth (Recommended)</p>
                <button
                  type="button"
                  onClick={handleGithubOAuthRedirect}
                  disabled={!hasGithubOAuth}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#24292e] to-[#2f363d] hover:from-primary hover:to-accent text-white font-black text-xs uppercase tracking-wider transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg shadow-black/10 hover:shadow-primary/20 border border-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Github size={18} className="animate-pulse" /> Link via GitHub OAuth (Secure)
                </button>
                {!hasGithubOAuth && (
                  <p className="text-[10px] font-bold text-amber-500 mt-2">
                    GitHub OAuth is not configured. Add VITE_GITHUB_CLIENT_ID in the frontend .env file.
                  </p>
                )}
              </div>

              {/* Elegant Divider */}
              <div className="relative my-6 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <span className="relative px-4 bg-[#121214] text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  OR USE DIRECT USERNAME SYNC
                </span>
              </div>

              {/* Method B: Public Username Sync */}
              <form onSubmit={handleConnectGithub} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Method 2: Public GitHub Username</label>
                  <input
                    type="text"
                    autoFocus
                    className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all text-sm font-semibold mt-2"
                    placeholder="e.g. google, torvalds, yourusername"
                    value={githubInput}
                    onChange={e => setGithubInput(e.target.value)}
                    required
                  />
                </div>

                {syncStatus && (
                  <div className="p-4 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-xl text-center animate-pulse">
                    {syncStatus}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGithubModal(false)}
                    className="flex-1 px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!!syncStatus}
                    className="flex-1 btn-primary justify-center text-xs"
                  >
                    {syncStatus ? <Loader2 className="animate-spin" size={14} /> : <span>Verify & Connect</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LINKEDIN CONNECT MODAL */}
      {showLinkedinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowLinkedinModal(false)} />
          <div className="glass max-w-md w-full relative z-10 p-8 rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 card-premium">
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <Linkedin size={24} className="text-[#0a66c2]" /> Connect LinkedIn Profile
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Link your profile to import your professional network, certifications, and experience into your academic portfolio.
            </p>

            <div className="space-y-4">
              {/* Method B: Public Username / URL Sync */}
              <form onSubmit={handleConnectLinkedIn} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">LinkedIn Profile URL or Username</label>
                  <div className="relative mt-2">
                    <input
                      type="text"
                      className="w-full p-4 pr-16 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all text-sm font-semibold"
                      placeholder="e.g. your-username or https://linkedin.com/in/username"
                      value={linkedinInput}
                      onChange={e => setLinkedinInput(e.target.value)}
                      required
                    />
                    {linkedinInput && (
                      <button
                        type="button"
                        onClick={() => setLinkedinInput('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors p-1"
                        title="Clear Input"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {syncStatus && (
                  <div className="p-4 bg-[#0a66c2]/10 border border-[#0a66c2]/20 text-[#0a66c2] text-xs font-bold rounded-xl text-center animate-pulse">
                    {syncStatus}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkedinModal(false)}
                    className="flex-1 px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!!syncStatus}
                    className="flex-1 bg-[#0a66c2] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:scale-[1.02] hover:bg-[#004182] transition-all flex items-center justify-center gap-2"
                  >
                    {syncStatus ? <Loader2 className="animate-spin" size={14} /> : <span>Verify & Connect</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LEETCODE CONNECT MODAL */}
      {showLeetcodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowLeetcodeModal(false)} />
          <div className="glass max-w-md w-full relative z-10 p-6 rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-extrabold mb-2 flex items-center gap-2">
              <Award size={24} className="text-[#ffa116]" /> Connect LeetCode Profile
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Enter your LeetCode handle. Coding counts and ranking will be fetched and analyzed.
            </p>
            <form onSubmit={handleConnectLeetcode}>
              <input
                type="text"
                autoFocus
                className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-[#ffa116]/20 focus:ring-4 transition-all text-sm font-semibold mb-6"
                placeholder="e.g. sethu-12, alex23"
                value={leetcodeInput}
                onChange={e => setLeetcodeInput(e.target.value)}
                required
              />
              {syncStatus && (
                <div className="p-4 bg-[#ffa116]/10 border border-[#ffa116]/20 text-[#ffa116] text-xs font-bold rounded-xl text-center mb-6 animate-pulse">
                  {syncStatus}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLeetcodeModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!syncStatus}
                  className="flex-1 py-3.5 rounded-xl bg-[#ffa116] text-[#1b1b1b] font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center"
                >
                  {syncStatus ? <Loader2 className="animate-spin" size={14} /> : <span>Sync Profile</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROJECT MODAL */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddProjectModal(false)} />
          <div className="glass max-w-md w-full relative z-10 p-8 rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 card-premium">
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              <Terminal size={24} className="text-primary" /> Record Academic Project
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Enter your project details manually. Your tech stack and description will be analyzed for capability scoring.
            </p>
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Project Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all text-sm font-semibold mt-2"
                  placeholder="e.g. Chat App, Neural Net Model"
                  value={newProject.title}
                  onChange={e => setNewProject({...newProject, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Description</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all text-sm font-semibold mt-2"
                  placeholder="What does this project do and what was your individual contribution?"
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Tech Stack (comma-separated)</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all text-sm font-semibold mt-2"
                  placeholder="e.g. React, Node.js, Python, Tailwind"
                  value={newProject.tech_stack}
                  onChange={e => setNewProject({...newProject, tech_stack: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">GitHub Repository URL (Optional)</label>
                <input 
                  type="url" 
                  className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-primary/20 focus:ring-4 transition-all text-sm font-semibold mt-2"
                  placeholder="https://github.com/username/repo"
                  value={newProject.github_url}
                  onChange={e => setNewProject({...newProject, github_url: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddProjectModal(false)}
                  className="flex-1 px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="flex-1 btn-primary justify-center text-xs"
                >
                  {createProjectMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <span>Record Project</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CERTIFICATION MODAL */}
      {showAddCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setShowAddCertModal(false); setEditingCertId(null); }} />
          <div className="glass max-w-md w-full relative z-10 p-8 rounded-3xl border border-border shadow-2xl animate-in zoom-in-95 duration-200 card-premium">
            <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-[#0a66c2]">
              <Award size={24} /> {editingCertId ? 'Edit Certification' : 'Record Certification'}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Add or update your professional credentials, cloud certifications, or specialized courses.
            </p>
            <form onSubmit={handleSubmitCert} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Certification Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-[#0a66c2]/20 focus:ring-4 transition-all text-sm font-semibold mt-2"
                  placeholder="e.g. AWS Certified Cloud Practitioner"
                  value={newCert.title}
                  onChange={e => setNewCert({...newCert, title: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Issuing Organization</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-[#0a66c2]/20 focus:ring-4 transition-all text-sm font-semibold mt-2"
                  placeholder="e.g. Amazon Web Services (AWS), Google"
                  value={newCert.provider}
                  onChange={e => setNewCert({...newCert, provider: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Issue Month & Year (Optional)</label>
                  <input 
                    type="month" 
                    className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-[#0a66c2]/20 focus:ring-4 transition-all text-sm font-semibold mt-2"
                    value={newCert.issue_date}
                    onChange={e => setNewCert({...newCert, issue_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Expiration Month & Year (Optional)</label>
                  <input 
                    type="month" 
                    className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-[#0a66c2]/20 focus:ring-4 transition-all text-sm font-semibold mt-2"
                    value={newCert.expiry_date}
                    onChange={e => setNewCert({...newCert, expiry_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Credential ID (Optional)</label>
                  <input 
                    type="text" 
                    className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-[#0a66c2]/20 focus:ring-4 transition-all text-sm font-semibold mt-2"
                    placeholder="e.g. AWS-12345"
                    value={newCert.credential_id}
                    onChange={e => setNewCert({...newCert, credential_id: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Verification URL (Optional)</label>
                  <input 
                    type="url" 
                    className="w-full p-4 bg-muted/40 rounded-2xl border border-border outline-none ring-[#0a66c2]/20 focus:ring-4 transition-all text-sm font-semibold mt-2"
                    placeholder="https://credly.com/..."
                    value={newCert.credential_url}
                    onChange={e => setNewCert({...newCert, credential_url: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowAddCertModal(false); setEditingCertId(null); }}
                  className="flex-1 px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createCertMutation.isPending || updateCertMutation.isPending}
                  className="flex-1 py-3.5 rounded-xl bg-[#0a66c2] text-white font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center"
                >
                  {createCertMutation.isPending || updateCertMutation.isPending ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <span>{editingCertId ? 'Save Changes' : 'Record Cert'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
