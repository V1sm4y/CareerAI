import React, { useCallback, useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { resumesApi } from '../../services/api';
import type { Resume } from '../../types';

interface Props {
  onUploaded: (resume: Resume) => void;
}

export default function ResumeUpload({ onUploaded }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setStatus('error');
      setMessage('Only PDF files are accepted.');
      return;
    }
    setIsUploading(true);
    setStatus('idle');
    try {
      const res = await resumesApi.upload(file);
      onUploaded(res.data);
      setStatus('success');
      setMessage(`"${file.name}" uploaded successfully!`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.response?.data?.detail ?? 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer
        ${ isDragging
          ? 'border-brand-500 bg-brand-500/10'
          : 'border-white/10 hover:border-brand-500/40 hover:bg-white/2'
        }`}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={onInputChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />

      <div className="flex flex-col items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
          ${ isDragging ? 'bg-brand-500/20 scale-110' : 'bg-dark-600' }`}>
          {isUploading ? (
            <div className="w-7 h-7 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className={`w-7 h-7 ${isDragging ? 'text-brand-400' : 'text-white/40'}`} />
          )}
        </div>

        <div>
          <p className="text-white font-medium mb-1">
            {isUploading ? 'Uploading...' : isDragging ? 'Drop to upload' : 'Drag & drop your resume'}
          </p>
          <p className="text-white/40 text-sm">PDF only · Max 5 MB</p>
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
