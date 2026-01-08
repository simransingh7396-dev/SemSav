
import React, { useState, useRef, useEffect } from 'react';
import { extractContentFromImage, generateNotesFromPDF } from '../services/gemini';
import { MockStore } from '../services/store';
import { User, GeminiExtraction, FileMetadata, Subject } from '../types';
import { IconCamera, IconUpload, IconPdf, IconReview } from '../components/Icons';
import { jsPDF } from "jspdf";

interface ContributorProps {
  user: User;
}

const Contributor: React.FC<ContributorProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingNotes, setGeneratingNotes] = useState(false);
  const [extractedData, setExtractedData] = useState<GeminiExtraction | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<FileMetadata | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [contentSummary, setContentSummary] = useState('');
  
  const [selectedType, setSelectedType] = useState('note');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setSubjects(MockStore.getSubjects());
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setSuccess(false);
    setError(null);
    setPreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const result = await extractContentFromImage(base64, file.type || 'image/jpeg');
        if (result) {
          setExtractedData(result);
        } else {
          setError("Failed to extract content. Please ensure the image is clear.");
        }
      } catch (err) {
        setError("AI Extraction Service Error.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("Only PDF files are allowed.");
      return;
    }

    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("File size too large. Please use PDFs under 50MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result as string
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAINotes = async () => {
    if (!attachedFile || !attachedFile.data) return;

    setGeneratingNotes(true);
    setError(null);

    try {
      const base64Pdf = attachedFile.data.split(',')[1];
      const notesText = await generateNotesFromPDF(base64Pdf);

      if (notesText) {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("AI Generated Study Notes", 10, 15);
        doc.setFontSize(10);
        doc.text(`Source: ${attachedFile.name}`, 10, 22);
        
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(notesText, 180);
        let y = 35;
        
        for (let i = 0; i < splitText.length; i++) {
            if (y > 280) {
                doc.addPage();
                y = 15;
            }
            doc.text(splitText[i], 10, y);
            y += 7;
        }

        const pdfDataUri = doc.output('datauristring');
        
        setAttachedFile({
          name: `AI_Notes_${attachedFile.name}`,
          size: pdfDataUri.length, 
          type: 'application/pdf',
          data: pdfDataUri
        });

        setContentSummary("Contains AI-generated structured study notes, key concepts, and formulas derived from the original document.");
        setSuccess(true); 
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("AI could not extract notes from this PDF.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate AI notes.");
    } finally {
      setGeneratingNotes(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const subjectId = formData.get('subjectId') as string;
    const title = formData.get('title') as string;
    const type = formData.get('type') as any;
    const content = formData.get('content') as string;
    const deadlineDate = formData.get('deadlineDate') as string;

    if (!title || !subjectId) {
      setError("Subject and Title are required.");
      setSubmitting(false);
      return;
    }

    if ((type === 'deadline' || type === 'test') && !deadlineDate) {
      setError("A Date is required for Deadlines and Tests.");
      setSubmitting(false);
      return;
    }
    
    try {
      await MockStore.addItem({
        subjectId,
        title,
        type,
        content: content || "No description provided.",
        uploaderId: user.enrollmentId,
        deadlineDate: deadlineDate || undefined,
        file: attachedFile || undefined
      });

      setSuccess(true);
      setAttachedFile(null);
      setContentSummary('');
      setSelectedType('note'); 
      if (formRef.current) formRef.current.reset();
      setExtractedData(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(err);
      setError("An error occurred during submission. Try again or check if the file is valid.");
    } finally {
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAISubmit = async () => {
    if (!extractedData || submitting) return;

    setSubmitting(true);
    const matchedSubject = subjects.find(s => 
      s.name.toLowerCase().includes(extractedData.subjectName.toLowerCase()) ||
      extractedData.subjectName.toLowerCase().includes(s.name.toLowerCase())
    );

    try {
      await MockStore.addItem({
        subjectId: matchedSubject?.id || subjects[0]?.id || 'misc',
        title: extractedData.assignmentTitle,
        type: 'deadline',
        content: `AI Extracted: Assignment for ${extractedData.subjectName}`,
        uploaderId: user.enrollmentId,
        deadlineDate: extractedData.deadlineDate,
      });

      setSuccess(true);
      setError(null);
      setExtractedData(null);
      setPreviewUrl(null);
    } catch (err) {
      setError("Failed to save AI extraction.");
    } finally {
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-800 overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-12 text-white">
          <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter italic">Contribution Engine</h2>
          <p className="opacity-80 text-lg font-medium max-w-2xl">Fuel the Saviours Hub. Scan your notes, upload PDFs, and earn XP to climb the ranks.</p>
        </div>

        <div className="p-12">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 text-red-400 rounded-2xl text-sm font-bold animate-in slide-in-from-top-4">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="mb-10 p-8 bg-emerald-900/20 border border-emerald-800 text-emerald-400 rounded-3xl flex items-center shadow-xl animate-in zoom-in duration-500">
              <span className="mr-4 text-4xl">✨</span>
              <div>
                <p className="font-black text-xl uppercase tracking-tight">Operation Successful!</p>
                <p className="text-sm font-bold opacity-80">Data synchronized with the branch repository.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-400">
                  <IconCamera />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">AI Image Extraction</h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Automated Metadata Parsing</p>
                </div>
              </div>

              <div 
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`group relative border-4 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  previewUrl ? 'border-indigo-400 bg-indigo-900/10' : 'border-slate-800 bg-slate-900 hover:border-indigo-700'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                {previewUrl ? (
                  <div className="relative w-full">
                    <img src={previewUrl} className="w-full max-h-64 object-cover rounded-3xl shadow-2xl" alt="Preview" />
                    <div className="absolute inset-0 bg-indigo-600/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-black shadow-xl uppercase text-[10px]">Swap Content</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center shadow-xl mb-6 group-hover:scale-110 transition-transform">
                      <IconCamera className="w-10 h-10 text-slate-400" />
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Upload Image</span>
                  </>
                )}
              </div>

              {loading && (
                <div className="flex items-center justify-center space-x-4 bg-indigo-900/10 p-6 rounded-3xl border border-indigo-800">
                  <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-black text-indigo-400 uppercase tracking-tighter text-sm">Gemini AI Engine Analyzing...</span>
                </div>
              )}

              {extractedData && !loading && (
                <div className="bg-slate-800 rounded-[2.5rem] p-8 border-2 border-indigo-500 shadow-2xl animate-in slide-in-from-top-8">
                  <h4 className="font-black text-white mb-6 flex items-center text-lg uppercase tracking-widest">
                    <IconPdf className="mr-3 w-5 h-5" /> Data Pack
                  </h4>
                  <div className="space-y-4 mb-8">
                    <div className="bg-slate-950 p-4 rounded-2xl">
                      <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Subject</label>
                      <div className="font-black text-white text-xl uppercase">{extractedData.subjectName}</div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl">
                      <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Assignment</label>
                      <div className="font-black text-white text-xl italic">"{extractedData.assignmentTitle}"</div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl">
                      <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Deadline</label>
                      <div className="font-black text-white text-xl italic">{extractedData.deadlineDate}</div>
                    </div>
                  </div>
                  <button 
                    onClick={handleAISubmit}
                    disabled={submitting}
                    className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/40 transform active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : <IconReview className="w-5 h-5" />}
                    <span className="uppercase tracking-widest text-xs">{submitting ? 'COMMITTING...' : 'AUTHORIZE UPLOAD'}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-8 bg-slate-950/50 p-8 rounded-[3rem] border border-slate-800">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-400 shadow-sm">
                  <IconUpload />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Direct Terminal</h3>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Manual Content Submission</p>
                </div>
              </div>
              
              <form ref={formRef} onSubmit={handleManualSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Target Subject</label>
                    <select name="subjectId" className="w-full p-4 rounded-2xl border border-slate-800 bg-slate-900 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Content Class</label>
                    <select 
                        name="type" 
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full p-4 rounded-2xl border border-slate-800 bg-slate-900 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="note">Notes / Docs</option>
                      <option value="test">Class Test Details</option>
                      <option value="lab">Lab Manual / Records</option>
                      <option value="deadline">Submission Alert</option>
                      <option value="cancellation">Class Update</option>
                      <option value="other">Misc. Contribution</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Item Title</label>
                  <input required name="title" type="text" placeholder="Be descriptive..." className="w-full p-5 rounded-2xl border border-slate-800 bg-slate-900 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-700" />
                </div>
                
                {['deadline', 'test', 'lab'].includes(selectedType) && (
                    <div className="animate-in slide-in-from-top-2">
                        <label className="block text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-3">Date (Required)</label>
                        <input 
                            required
                            name="deadlineDate" 
                            type="date" 
                            className="w-full p-5 rounded-2xl border border-slate-800 bg-slate-900 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-700 date-input-invert" 
                        />
                    </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">PDF Asset (Max 50MB)</label>
                  <div 
                    onClick={() => pdfInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-[2rem] flex items-center space-x-5 cursor-pointer transition-all ${
                      attachedFile ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <input type="file" ref={pdfInputRef} onChange={handlePdfUpload} className="hidden" accept="application/pdf" />
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform ${attachedFile ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-800 text-slate-400'}`}>
                      {attachedFile ? <IconPdf className="w-8 h-8" /> : <IconUpload className="w-8 h-8" />}
                    </div>
                    <div className="overflow-hidden">
                      <div className={`text-sm font-black truncate ${attachedFile ? 'text-indigo-400' : 'text-slate-400'}`}>
                        {attachedFile ? attachedFile.name : 'Attach Source PDF'}
                      </div>
                      <div className="text-[10px] text-slate-500 font-black tracking-widest uppercase">
                        {attachedFile ? `${(attachedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Up to 50MB supported'}
                      </div>
                    </div>
                    {attachedFile && (
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setAttachedFile(null); }}
                        className="ml-auto text-[10px] font-black text-red-400 hover:text-red-300 uppercase underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {attachedFile && (
                    <button
                      type="button"
                      onClick={handleGenerateAINotes}
                      disabled={generatingNotes}
                      className="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      {generatingNotes ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Analyzing Document...
                        </>
                      ) : (
                        <>
                          ✨ Generate AI Study Notes PDF
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Summary</label>
                  <textarea 
                    name="content" 
                    rows={4} 
                    value={contentSummary}
                    onChange={(e) => setContentSummary(e.target.value)}
                    placeholder="Brief context for your peers..." 
                    className="w-full p-5 rounded-2xl border border-slate-800 bg-slate-900 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-700"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting || generatingNotes}
                  className="w-full bg-white text-slate-900 font-black py-5 rounded-2xl hover:scale-[1.02] transition-all shadow-2xl active:scale-95 uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Committing...
                    </>
                  ) : 'Commit to Repository'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributor;
