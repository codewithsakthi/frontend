import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  BookOpen,
  Award,
  Calendar,
  Briefcase,
  Camera,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  PlusCircle,
  Linkedin,
  Globe,
  FileText
} from 'lucide-react';
import api from '../api/client';

export default function StaffProfessionalProfile() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  
  // Local states for sub-tabs inside profile
  const [profileTab, setProfileTab] = useState('Personal'); // Personal, Publications, Qualifications, Experience, Accomplishments
  
  // Modals state
  const [showAddQual, setShowAddQual] = useState(false);
  const [showAddExp, setShowAddExp] = useState(false);
  const [showAddPub, setShowAddPub] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [showAddAch, setShowAddAch] = useState(false);

  // Form states
  const [qualForm, setQualForm] = useState({ degree: '', specialisation: '', institution: '', year_of_passing: '', grade_or_percentage: '' });
  const [expForm, setExpForm] = useState({ organisation: '', role: '', start_date: '', end_date: '', is_current: false, experience_type: 'Teaching' });
  const [pubForm, setPubForm] = useState({ title: '', publication_type: 'Journal', journal_or_conf: '', year: '', doi_or_url: '', is_indexed: false });
  const [certForm, setCertForm] = useState({ certification_name: '', issuing_body: '', issue_date: '', expiry_date: '', credential_id: '' });
  const [achForm, setAchForm] = useState({ title: '', category: 'Award', awarded_by: '', year: '', description: '' });

  // Fetch full professional profile
  const { data: fullProfile, isLoading, refetch } = useQuery({
    queryKey: ['staff-profile-full'],
    queryFn: () => api.get('staff/me/profile'),
  });

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (profileData) => api.put('staff/me/profile', profileData),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-profile-full']);
      alert('Professional profile updated successfully!');
    },
    onError: (err) => alert(`Update failed: ${err.message}`)
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: (formData) => api.post('staff/me/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-profile-full']);
      alert('Profile picture uploaded successfully!');
    },
    onError: (err) => alert(`Upload failed: ${err.message}`)
  });

  const addQualMutation = useMutation({
    mutationFn: (data) => api.post('staff/me/qualifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-profile-full']);
      setShowAddQual(false);
      setQualForm({ degree: '', specialisation: '', institution: '', year_of_passing: '', grade_or_percentage: '' });
    }
  });

  const deleteQualMutation = useMutation({
    mutationFn: (id) => api.delete(`staff/me/qualifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['staff-profile-full'])
  });

  const addExpMutation = useMutation({
    mutationFn: (data) => api.post('staff/me/experiences', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-profile-full']);
      setShowAddExp(false);
      setExpForm({ organisation: '', role: '', start_date: '', end_date: '', is_current: false, experience_type: 'Teaching' });
    }
  });

  const deleteExpMutation = useMutation({
    mutationFn: (id) => api.delete(`staff/me/experiences/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['staff-profile-full'])
  });

  const addPubMutation = useMutation({
    mutationFn: (data) => api.post('staff/me/publications', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-profile-full']);
      setShowAddPub(false);
      setPubForm({ title: '', publication_type: 'Journal', journal_or_conf: '', year: '', doi_or_url: '', is_indexed: false });
    }
  });

  const deletePubMutation = useMutation({
    mutationFn: (id) => api.delete(`staff/me/publications/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['staff-profile-full'])
  });

  const addCertMutation = useMutation({
    mutationFn: (data) => api.post('staff/me/certifications', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-profile-full']);
      setShowAddCert(false);
      setCertForm({ certification_name: '', issuing_body: '', issue_date: '', expiry_date: '', credential_id: '' });
    }
  });

  const deleteCertMutation = useMutation({
    mutationFn: (id) => api.delete(`staff/me/certifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['staff-profile-full'])
  });

  const addAchMutation = useMutation({
    mutationFn: (data) => api.post('staff/me/achievements', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff-profile-full']);
      setShowAddAch(false);
      setAchForm({ title: '', category: 'Award', awarded_by: '', year: '', description: '' });
    }
  });

  const deleteAchMutation = useMutation({
    mutationFn: (id) => api.delete(`staff/me/achievements/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['staff-profile-full'])
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const profile = fullProfile?.profile || {};
  const qualifications = fullProfile?.qualifications || [];
  const experiences = fullProfile?.experiences || [];
  const certifications = fullProfile?.certifications || [];
  const publications = fullProfile?.publications || [];
  const achievements = fullProfile?.achievements || [];

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    uploadPhotoMutation.mutate(formData);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Convert numerical and date types
    if (data.years_of_experience) {
      data.years_of_experience = parseFloat(data.years_of_experience);
    }
    if (!data.date_of_joining) {
      delete data.date_of_joining;
    }
    
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ─── Hero Panel (Visual Header) ─── */}
      <div className="glass rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-primary/10 via-background to-accent/5 border border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="flex flex-col md:flex-row items-center gap-6 z-10 w-full">
          {/* Avatar Upload Container */}
          <div className="relative group w-28 h-28 min-w-[112px] rounded-[2rem] bg-gradient-to-tr from-primary to-accent overflow-hidden shadow-xl border border-primary/20 flex-shrink-0 flex items-center justify-center">
            {profile?.profile_photo_url ? (
              <img 
                src={`${api.defaults.baseURL.replace('/api/v1', '')}${profile.profile_photo_url}`} 
                alt="Profile" 
                className="h-full w-full object-cover" 
                onError={(e) => {
                  // Fallback standard initials
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=Faculty&background=6366f1&color=fff&size=128`;
                }}
              />
            ) : (
              <User size={48} className="text-white animate-pulse" />
            )}
            
            {/* Upload Hover Overlay */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white z-20"
            >
              <Camera size={22} className="mb-1 animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-widest">Upload Photo</span>
            </div>

            {uploadPhotoMutation.isPending && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                <Loader2 className="animate-spin text-white" size={24} />
              </div>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handlePhotoUpload} 
          />

          <div className="text-center md:text-left flex-1 space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              Faculty Profile Console
            </h2>
            <p className="text-sm font-semibold text-primary/80 uppercase tracking-widest">
              {profile?.designation || 'Academic Specialist'} — {profile?.employee_type || 'Full Time'}
            </p>
            {profile?.bio ? (
              <p className="text-sm text-muted-foreground max-w-2xl italic">"{profile.bio}"</p>
            ) : (
              <p className="text-xs text-muted-foreground/60 max-w-xl">No professional bio added. Add details under the Personal tab below to inspire students.</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Profile Navigation Tabs ─── */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border/40 w-fit">
        {[
          { id: 'Personal', label: 'Faculty Info', icon: User },
          { id: 'Publications', label: 'Journals & Papers', icon: BookOpen },
          { id: 'Qualifications', label: 'Qualifications', icon: Award },
          { id: 'Experience', label: 'Work History', icon: Briefcase },
          { id: 'Accomplishments', label: 'Accomplishments', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setProfileTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                profileTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Sub-Tab Panels ─── */}
      
      {/* 1. PERSONAL INFORMATION */}
      {profileTab === 'Personal' && (
        <div className="panel animate-in zoom-in-95 duration-200">
          <h3 className="text-lg font-bold mb-6">✍️ Academic Profile Info</h3>
          
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Current Designation</label>
                <input 
                  name="designation" 
                  className="input-field w-full" 
                  defaultValue={profile?.designation || ''} 
                  placeholder="Assistant Professor, HOD, Director, etc."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Specialisation / Domain</label>
                <input 
                  name="specialisation" 
                  className="input-field w-full" 
                  defaultValue={profile?.specialisation || ''} 
                  placeholder="Machine Learning, Software Engineering, etc."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Years of Experience</label>
                <input 
                  name="years_of_experience" 
                  type="number" 
                  step="0.1" 
                  className="input-field w-full" 
                  defaultValue={profile?.years_of_experience || ''} 
                  placeholder="e.g. 5.5"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Employment Type</label>
                <select 
                  name="employee_type" 
                  className="input-field w-full" 
                  defaultValue={profile?.employee_type || 'Full Time'}
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Associate">Associate</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Guest Faculty">Guest Faculty</option>
                  <option value="Adjunct Professor">Adjunct Professor</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Date of Joining</label>
                <input 
                  name="date_of_joining" 
                  type="date" 
                  className="input-field w-full" 
                  defaultValue={profile?.date_of_joining || ''} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Google Scholar URL</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-muted-foreground"><Globe size={14} /></span>
                  <input 
                    name="google_scholar_url" 
                    className="input-field w-full pl-10" 
                    defaultValue={profile?.google_scholar_url || ''} 
                    placeholder="https://scholar.google.com/citations?user=..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">ORCID ID</label>
                <input 
                  name="orcid_id" 
                  className="input-field w-full" 
                  defaultValue={profile?.orcid_id || ''} 
                  placeholder="e.g. 0000-0002-1825-0097"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Professional Bio / Summary</label>
                <textarea 
                  name="bio" 
                  rows={4} 
                  className="input-field w-full py-3" 
                  defaultValue={profile?.bio || ''} 
                  placeholder="Write a concise 2-3 sentence overview of your teaching philosophy, research focus, and background..."
                />
              </div>

            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={updateProfileMutation.isPending} 
                className="btn-primary flex items-center gap-2"
              >
                {updateProfileMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Save Faculty Details</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. PUBLICATIONS & JOURNALS */}
      {profileTab === 'Publications' && (
        <div className="panel animate-in zoom-in-95 duration-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">📚 Research Journals & Publications</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your peer-reviewed papers, book chapters, conferences, and patents.</p>
            </div>
            <button 
              onClick={() => setShowAddPub(true)}
              className="btn-primary flex items-center gap-1.5 py-2 px-3 text-xs"
            >
              <Plus size={14} /> Add Publication
            </button>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {publications.length > 0 ? (
              publications.map((pub) => (
                <div key={pub.id} className="p-4 rounded-2xl border border-border/60 bg-card/40 hover:border-primary/30 transition-all relative group flex flex-col justify-between gap-3">
                  <button 
                    onClick={() => {
                      if(confirm('Are you sure you want to delete this publication?')) {
                        deletePubMutation.mutate(pub.id);
                      }
                    }}
                    className="absolute top-4 right-4 p-1.5 rounded-lg border border-border/80 hover:bg-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Publication"
                  >
                    <Trash2 size={12} />
                  </button>
                  
                  <div>
                    <div className="flex items-start gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        pub.publication_type === 'Patent' 
                          ? 'bg-amber-500/10 text-amber-500' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {pub.publication_type || 'Journal'}
                      </span>
                      {pub.is_indexed && (
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500">
                          SCOPUS / WoS INDEXED
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-sm text-foreground mt-2 max-w-[90%] leading-relaxed">{pub.title}</h4>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">
                      📖 {pub.journal_or_conf} {pub.year && `• ${pub.year}`}
                    </p>
                  </div>

                  {pub.doi_or_url && (
                    <div className="pt-1 flex items-center justify-between text-xs">
                      <a 
                        href={pub.doi_or_url.startsWith('http') ? pub.doi_or_url : `https://doi.org/${pub.doi_or_url}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline font-extrabold flex items-center gap-1"
                      >
                        <span>View Publication / Patent</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-3xl">
                <BookOpen size={36} className="mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs font-bold text-muted-foreground">No publications listed yet.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Record your journal papers and research publications above.</p>
              </div>
            )}
          </div>

          {/* Add Publication Modal */}
          {showAddPub && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card w-full max-w-lg rounded-3xl border border-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                <h4 className="text-lg font-bold">📄 Add New Publication</h4>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addPubMutation.mutate({
                    ...pubForm,
                    year: pubForm.year ? parseInt(pubForm.year) : undefined
                  });
                }} className="space-y-4 text-left">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Publication Title</label>
                    <input 
                      className="input-field w-full" 
                      value={pubForm.title} 
                      onChange={e => setPubForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Enter Title..." 
                      required 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Type</label>
                    <select 
                      className="input-field w-full" 
                      value={pubForm.publication_type} 
                      onChange={e => setPubForm(f => ({ ...f, publication_type: e.target.value }))}
                    >
                      <option value="Journal">Journal Paper</option>
                      <option value="Conference">Conference Paper</option>
                      <option value="Book Chapter">Book Chapter</option>
                      <option value="Patent">Patent</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Journal / Conference Name</label>
                    <input 
                      className="input-field w-full" 
                      value={pubForm.journal_or_conf} 
                      onChange={e => setPubForm(f => ({ ...f, journal_or_conf: e.target.value }))}
                      placeholder="e.g. IEEE Transactions on Smart Grid, ACM SIGMOD..." 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-muted-foreground">Year of Publication</label>
                      <input 
                        type="number" 
                        className="input-field w-full" 
                        value={pubForm.year} 
                        onChange={e => setPubForm(f => ({ ...f, year: e.target.value }))}
                        placeholder="e.g. 2026" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-muted-foreground">Is Indexed?</label>
                      <div className="flex items-center gap-2 h-[48px] pl-2">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-primary" 
                          checked={pubForm.is_indexed} 
                          onChange={e => setPubForm(f => ({ ...f, is_indexed: e.target.checked }))}
                        />
                        <span className="text-xs font-semibold">Scopus / Web of Science</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">DOI / Publication Link</label>
                    <input 
                      className="input-field w-full" 
                      value={pubForm.doi_or_url} 
                      onChange={e => setPubForm(f => ({ ...f, doi_or_url: e.target.value }))}
                      placeholder="e.g. https://doi.org/10.1109/..." 
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddPub(false)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-border hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={addPubMutation.isPending}
                      className="btn-primary px-5 py-2 text-xs"
                    >
                      {addPubMutation.isPending ? 'Saving...' : 'Add Record'}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. QUALIFICATIONS */}
      {profileTab === 'Qualifications' && (
        <div className="panel animate-in zoom-in-95 duration-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">🎓 Academic Qualifications</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your degrees, certifications, doctorates, and achievements.</p>
            </div>
            <button 
              onClick={() => setShowAddQual(true)}
              className="btn-primary flex items-center gap-1.5 py-2 px-3 text-xs"
            >
              <Plus size={14} /> Add Degree
            </button>
          </div>

          <div className="space-y-4">
            {qualifications.length > 0 ? (
              qualifications.map((qual) => (
                <div key={qual.id} className="p-4 rounded-2xl border border-border bg-card/40 flex justify-between items-center group hover:border-primary/30 transition-all relative">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{qual.degree} in {qual.specialisation}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      🏫 {qual.institution} {qual.year_of_passing && `• Class of ${qual.year_of_passing}`}
                    </p>
                    {qual.grade_or_percentage && (
                      <p className="text-[10px] text-primary font-black mt-1 uppercase tracking-wider">
                        Grade: {qual.grade_or_percentage}
                      </p>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => {
                      if(confirm('Are you sure you want to delete this qualification?')) {
                        deleteQualMutation.mutate(qual.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    title="Delete Degree"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-3xl">
                <Award size={36} className="mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs font-bold text-muted-foreground">No qualifications listed yet.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Record your doctorates, master degrees, and graduation profiles.</p>
              </div>
            )}
          </div>

          {/* Add Qualification Modal */}
          {showAddQual && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-4">
                <h4 className="text-lg font-bold font-black">🎓 Add Academic Qualification</h4>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addQualMutation.mutate({
                    ...qualForm,
                    year_of_passing: qualForm.year_of_passing ? parseInt(qualForm.year_of_passing) : undefined
                  });
                }} className="space-y-4 text-left">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Degree / Diploma</label>
                    <input 
                      className="input-field w-full" 
                      value={qualForm.degree} 
                      onChange={e => setQualForm(f => ({ ...f, degree: e.target.value }))}
                      placeholder="e.g. Ph.D, M.Tech, MCA..." 
                      required 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Specialisation</label>
                    <input 
                      className="input-field w-full" 
                      value={qualForm.specialisation} 
                      onChange={e => setQualForm(f => ({ ...f, specialisation: e.target.value }))}
                      placeholder="e.g. Computer Science, VLSI..." 
                      required 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Institution / University</label>
                    <input 
                      className="input-field w-full" 
                      value={qualForm.institution} 
                      onChange={e => setQualForm(f => ({ ...f, institution: e.target.value }))}
                      placeholder="Enter University or School..." 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-muted-foreground">Year of Passing</label>
                      <input 
                        type="number" 
                        className="input-field w-full" 
                        value={qualForm.year_of_passing} 
                        onChange={e => setQualForm(f => ({ ...f, year_of_passing: e.target.value }))}
                        placeholder="e.g. 2018" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-muted-foreground">Grade / CGPA</label>
                      <input 
                        className="input-field w-full" 
                        value={qualForm.grade_or_percentage} 
                        onChange={e => setQualForm(f => ({ ...f, grade_or_percentage: e.target.value }))}
                        placeholder="e.g. 9.2 or First Class" 
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddQual(false)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-border hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={addQualMutation.isPending}
                      className="btn-primary px-5 py-2 text-xs"
                    >
                      {addQualMutation.isPending ? 'Saving...' : 'Add Degree'}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. WORK HISTORY */}
      {profileTab === 'Experience' && (
        <div className="panel animate-in zoom-in-95 duration-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">💼 Professional Experience & Work History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your corporate, academic, and industrial timeline.</p>
            </div>
            <button 
              onClick={() => setShowAddExp(true)}
              className="btn-primary flex items-center gap-1.5 py-2 px-3 text-xs"
            >
              <Plus size={14} /> Add Experience
            </button>
          </div>

          <div className="space-y-4">
            {experiences.length > 0 ? (
              experiences.map((exp) => (
                <div key={exp.id} className="p-4 rounded-2xl border border-border bg-card/40 flex justify-between items-center group hover:border-primary/30 transition-all relative">
                  <div>
                    <h4 className="font-extrabold text-sm text-foreground">{exp.role}</h4>
                    <p className="text-xs text-muted-foreground font-semibold mt-1">
                      🏢 {exp.organisation} • <span className="uppercase text-[10px] text-primary">{exp.experience_type || 'Teaching'}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                      📅 {exp.start_date ? new Date(exp.start_date).toLocaleDateString() : 'N/A'} - {exp.is_current ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString() : 'N/A')}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if(confirm('Are you sure you want to delete this experience?')) {
                        deleteExpMutation.mutate(exp.id);
                      }
                    }}
                    className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    title="Delete Experience"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-3xl">
                <Briefcase size={36} className="mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs font-bold text-muted-foreground">No experience history listed yet.</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Record your prior academic research, corporate jobs, or training history.</p>
              </div>
            )}
          </div>

          {/* Add Experience Modal */}
          {showAddExp && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-4">
                <h4 className="text-lg font-bold font-black">💼 Add Work Experience</h4>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addExpMutation.mutate({
                    ...expForm,
                    start_date: expForm.start_date || undefined,
                    end_date: expForm.is_current ? undefined : (expForm.end_date || undefined)
                  });
                }} className="space-y-4 text-left">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Organisation / Institution</label>
                    <input 
                      className="input-field w-full" 
                      value={expForm.organisation} 
                      onChange={e => setExpForm(f => ({ ...f, organisation: e.target.value }))}
                      placeholder="e.g. Lenovo, Stanford University..." 
                      required 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Role / Designation</label>
                    <input 
                      className="input-field w-full" 
                      value={expForm.role} 
                      onChange={e => setExpForm(f => ({ ...f, role: e.target.value }))}
                      placeholder="e.g. Senior Researcher, Assistant Professor..." 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-muted-foreground">Start Date</label>
                      <input 
                        type="date" 
                        className="input-field w-full" 
                        value={expForm.start_date} 
                        onChange={e => setExpForm(f => ({ ...f, start_date: e.target.value }))}
                        required 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-muted-foreground">End Date</label>
                      <input 
                        type="date" 
                        className="input-field w-full" 
                        value={expForm.end_date} 
                        onChange={e => setExpForm(f => ({ ...f, end_date: e.target.value }))}
                        disabled={expForm.is_current} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="space-y-1 flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-primary" 
                        checked={expForm.is_current} 
                        onChange={e => setExpForm(f => ({ ...f, is_current: e.target.checked }))}
                      />
                      <span className="text-xs font-bold">Currently working here?</span>
                    </div>

                    <div className="space-y-1 flex-1">
                      <select 
                        className="input-field w-full h-[40px] text-xs font-bold" 
                        value={expForm.experience_type} 
                        onChange={e => setExpForm(f => ({ ...f, experience_type: e.target.value }))}
                      >
                        <option value="Teaching">Teaching</option>
                        <option value="Industrial">Industrial</option>
                        <option value="Research">Research</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddExp(false)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-border hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={addExpMutation.isPending}
                      className="btn-primary px-5 py-2 text-xs"
                    >
                      {addExpMutation.isPending ? 'Saving...' : 'Add Record'}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. ACCOMPLISHMENTS & CERTIFICATIONS */}
      {profileTab === 'Accomplishments' && (
        <div className="grid md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-200">
          
          {/* Certifications Card */}
          <div className="panel space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">🏆 Professional Certifications</h3>
              <button 
                onClick={() => setShowAddCert(true)}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {certifications.length > 0 ? (
                certifications.map((cert) => (
                  <div key={cert.id} className="p-3.5 rounded-xl border border-border bg-card/30 flex justify-between items-center group relative">
                    <div>
                      <h4 className="font-extrabold text-sm">{cert.certification_name}</h4>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">🎖 {cert.issuing_body}</p>
                      {cert.credential_id && (
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">ID: {cert.credential_id}</p>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => {
                        if(confirm('Are you sure you want to delete this certification?')) {
                          deleteCertMutation.mutate(cert.id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-border rounded-2xl">
                  <Award size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">No certifications listed.</p>
                </div>
              )}
            </div>
          </div>

          {/* Achievements Card */}
          <div className="panel space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">🏅 Awards & Honors</h3>
              <button 
                onClick={() => setShowAddAch(true)}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
              >
                <Plus size={12} /> Add
              </button>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {achievements.length > 0 ? (
                achievements.map((ach) => (
                  <div key={ach.id} className="p-3.5 rounded-xl border border-border bg-card/30 flex justify-between items-center group relative">
                    <div>
                      <h4 className="font-extrabold text-sm">{ach.title}</h4>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">🏆 {ach.awarded_by} • {ach.year}</p>
                      {ach.description && <p className="text-xs text-muted-foreground/80 mt-1.5 leading-relaxed">{ach.description}</p>}
                    </div>
                    
                    <button 
                      onClick={() => {
                        if(confirm('Are you sure you want to delete this achievement?')) {
                          deleteAchMutation.mutate(ach.id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-border hover:bg-rose-500/10 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-border rounded-2xl">
                  <Award size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">No achievements listed.</p>
                </div>
              )}
            </div>
          </div>

          {/* Add Certification Modal */}
          {showAddCert && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-4">
                <h4 className="text-lg font-bold font-black">🏅 Add Certification</h4>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addCertMutation.mutate({
                    ...certForm,
                    issue_date: certForm.issue_date || undefined,
                    expiry_date: certForm.expiry_date || undefined
                  });
                }} className="space-y-4 text-left">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Certification Name</label>
                    <input 
                      className="input-field w-full" 
                      value={certForm.certification_name} 
                      onChange={e => setCertForm(f => ({ ...f, certification_name: e.target.value }))}
                      placeholder="e.g. AWS Solutions Architect..." 
                      required 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Issuing Body</label>
                    <input 
                      className="input-field w-full" 
                      value={certForm.issuing_body} 
                      onChange={e => setCertForm(f => ({ ...f, issuing_body: e.target.value }))}
                      placeholder="e.g. Amazon Web Services, Coursera..." 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-muted-foreground">Issue Date</label>
                      <input 
                        type="date" 
                        className="input-field w-full" 
                        value={certForm.issue_date} 
                        onChange={e => setCertForm(f => ({ ...f, issue_date: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase text-muted-foreground">Expiry Date</label>
                      <input 
                        type="date" 
                        className="input-field w-full" 
                        value={certForm.expiry_date} 
                        onChange={e => setCertForm(f => ({ ...f, expiry_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Credential ID</label>
                    <input 
                      className="input-field w-full" 
                      value={certForm.credential_id} 
                      onChange={e => setCertForm(f => ({ ...f, credential_id: e.target.value }))}
                      placeholder="Credential License ID..." 
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddCert(false)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-border hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={addCertMutation.isPending}
                      className="btn-primary px-5 py-2 text-xs"
                    >
                      {addCertMutation.isPending ? 'Saving...' : 'Add Certificate'}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

          {/* Add Achievement Modal */}
          {showAddAch && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-4">
                <h4 className="text-lg font-bold font-black">🏅 Add Award or Honor</h4>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  addAchMutation.mutate({
                    ...achForm,
                    year: achForm.year ? parseInt(achForm.year) : undefined
                  });
                }} className="space-y-4 text-left">
                  
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Award Title</label>
                    <input 
                      className="input-field w-full" 
                      value={achForm.title} 
                      onChange={e => setAchForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Best Faculty Award, Research Excellence..." 
                      required 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Awarded By</label>
                    <input 
                      className="input-field w-full" 
                      value={achForm.awarded_by} 
                      onChange={e => setAchForm(f => ({ ...f, awarded_by: e.target.value }))}
                      placeholder="e.g. College Management, IEEE Board..." 
                      required 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Year Awarded</label>
                    <input 
                      type="number" 
                      className="input-field w-full" 
                      value={achForm.year} 
                      onChange={e => setAchForm(f => ({ ...f, year: e.target.value }))}
                      placeholder="e.g. 2026" 
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase text-muted-foreground">Description</label>
                    <textarea 
                      rows={3}
                      className="input-field w-full py-2" 
                      value={achForm.description} 
                      onChange={e => setAchForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Short description or context of the award..." 
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddAch(false)}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-border hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={addAchMutation.isPending}
                      className="btn-primary px-5 py-2 text-xs"
                    >
                      {addAchMutation.isPending ? 'Saving...' : 'Add Award'}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
