import React, { useState } from 'react';
import { useLanguage } from '../i18n/Context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient, DriveFile } from '../services/api';
import toast from 'react-hot-toast';

export function DriveSection() {
  const { t } = useLanguage();
  const [isConnected, setIsConnected] = useState(false);
  const [authCode, setAuthCode] = useState('');

  const filesQuery = useQuery({
    queryKey: ['drive-files'],
    queryFn: () => apiClient.getDriveFiles(),
    enabled: isConnected,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const authMutation = useMutation({
    mutationFn: (code: string) => apiClient.authenticateDrive({ code }),
    onSuccess: (response) => {
      if (response.success) {
        setIsConnected(true);
        setAuthCode('');
        toast.success('Google Drive connected successfully');
      }
    },
    onError: () => {
      toast.error(t('drive.error') as string);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadToDrive({ file }),
    onSuccess: () => {
      toast.success('File uploaded to Drive');
      filesQuery.refetch();
    },
    onError: () => {
      toast.error(t('drive.error') as string);
    },
  });

  const handleConnect = () => {
    // In a real implementation, this would redirect to Google OAuth
    const clientId = 'your-client-id';
    const redirectUri = `${window.location.origin}/auth/google-drive`;
    const scope = 'https://www.googleapis.com/auth/drive.file';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `access_type=offline`;
    
    // For demo purposes, we'll simulate the connection
    setIsConnected(true);
    toast.success('Google Drive connected (demo mode)');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadMutation.mutate(files[0]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <section id="drive" className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('drive.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('drive.description')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Connect Google Drive
            </h3>
            
            <p className="text-gray-600 mb-8">
              Seamlessly integrate your Google Drive with DiamondBridge to manage files, collaborate on projects, and access your content from anywhere.
            </p>

            <button
              onClick={handleConnect}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>{t('drive.connectButton')}</span>
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {t('drive.permissions')}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="drive" className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('drive.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('drive.description')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.01 18h-1.999c-.552 0-1-.447-1-1s.448-1 1-1h1.999c.553 0 1 .447 1 1s-.447 1-1 1zm0-5h-2v-1h2v1zm0-3h-2c-1.103 0-2 .897-2 2v5h2v-3h2v3h2v-5c0-1.103-.897-2-2-2zm7-8h-5v2h3l-1 3h-2v5h5v-5h-2v-3l1-3h1v-2z"/>
                </svg>
              </div>
              <span className="font-semibold">{t('drive.connected')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-green-200">{t('drive.syncStatus')}: Active</span>
              <label className="px-4 py-2 bg-green-500 rounded-lg hover:bg-green-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                {t('drive.uploadToDrive')}
              </label>
            </div>
          </div>

          {/* Files List */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">{t('drive.files')}</h3>
              <div className="text-sm text-gray-500">
                Last sync: {new Date().toLocaleTimeString()}
              </div>
            </div>

            {filesQuery.isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              </div>
            ) : filesQuery.data && filesQuery.data.success && filesQuery.data.data ? (
              <div className="space-y-4">
                {filesQuery.data.data.map((file) => (
                  <div key={file.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{file.name}</h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • Modified {formatDate(new Date(file.modifiedAt))}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(file.webViewLink, '_blank')}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        Open
                      </button>
                      <button className="px-3 py-1 text-green-600 hover:bg-green-50 rounded transition-colors">
                        {t('drive.downloadFromDrive')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No files found</h4>
                <p className="text-gray-500 mb-4">Start by uploading your first file to Google Drive.</p>
                <label className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  Upload First File
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
