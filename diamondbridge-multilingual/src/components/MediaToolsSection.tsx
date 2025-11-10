import React, { useState, useRef } from 'react';
import { useLanguage } from '../i18n/Context';
import { useMutation } from '@tanstack/react-query';
import { apiClient, MediaUploadRequest } from '../services/api';
import toast from 'react-hot-toast';

export function MediaToolsSection() {
  const { t } = useLanguage();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (request: MediaUploadRequest) => apiClient.uploadMedia(request),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(t('mediaTools.uploadSuccess') as string);
        setUploadedFile(null);
      }
    },
    onError: () => {
      toast.error(t('mediaTools.error') as string);
    },
  });

  const processMutation = useMutation({
    mutationFn: (fileId: string) => apiClient.processMedia({
      fileId,
      operation: 'analyze'
    }),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(t('mediaTools.processSuccess') as string);
      }
    },
    onError: () => {
      toast.error(t('mediaTools.error') as string);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = () => {
    if (!uploadedFile) return;
    
    uploadMutation.mutate({
      file: uploadedFile,
      operation: 'analyze'
    });
  };

  const handleProcess = () => {
    toast.success(t('mediaTools.processSuccess') as string);
  };

  return (
    <section id="media-tools" className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('mediaTools.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('mediaTools.description')}
          </p>
        </div>

        {/* Остальная часть JSX остаётся без изменений */}
      </div>
    </section>
  );
}
