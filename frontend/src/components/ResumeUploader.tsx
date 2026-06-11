"use client";
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAnalyzeStore } from '@/store/analyzeStore';
import { UploadCloud, FileText, X } from 'lucide-react';

export function ResumeUploader() {
  const { file, setFile } = useAnalyzeStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, [setFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false
  });

  return (
    <div className="w-full">
      <h2 className="text-lg font-bold text-slate-900 mb-2">1. Upload Resume</h2>
      {!file ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[#1D9E75] bg-teal-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-700">Drag & drop your resume here</p>
          <p className="text-xs text-slate-500 mt-1">Accepts PDF and DOCX (Max 5MB)</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl p-4 flex items-center justify-between bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-teal-50 p-2 rounded-lg text-[#1D9E75]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button onClick={() => setFile(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
