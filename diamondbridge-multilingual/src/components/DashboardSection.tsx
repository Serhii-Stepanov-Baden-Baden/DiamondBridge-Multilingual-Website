import React from 'react';
import { useI18n } from '../i18n/Context';
import { useQuery } from '@tanstack/react-query';
import { apiClient, HealthStatus } from '../services/api';
import toast from 'react-hot-toast';

export function DashboardSection() {
  const { t } = useI18n();

  const healthQuery = useQuery({
    queryKey: ['health-status'],
    queryFn: () => apiClient.getHealthStatus(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'degraded':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'unhealthy':
      case 'down':
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  };

  const healthData = healthQuery.data?.data as HealthStatus | undefined;

  return (
    <section id="dashboard" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('dashboard.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('dashboard.description')}
          </p>
        </div>

        {/* Overall Status */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              {t('dashboard.overallStatus')}
            </h3>
            <button
              onClick={() => healthQuery.refetch()}
              disabled={healthQuery.isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
            >
              <svg className={`w-4 h-4 ${healthQuery.isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{t('dashboard.refreshButton')}</span>
            </button>
          </div>

          {healthQuery.isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : healthData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className={`p-6 rounded-xl text-center ${getStatusColor(healthData.status)}`}>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
                    {getStatusIcon(healthData.status)}
                  </div>
                  <h4 className="text-xl font-bold capitalize mb-2">{healthData.status}</h4>
                  <p className="text-sm opacity-75">
                    {healthData.status === 'healthy' && t('dashboard.healthy')}
                    {healthData.status === 'degraded' && t('dashboard.degraded')}
                    {healthData.status === 'unhealthy' && t('dashboard.unhealthy')}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{t('dashboard.uptime')}</div>
                    <div className="text-xl font-bold text-gray-900">
                      {formatUptime(healthData.uptime)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">{t('dashboard.version')}</div>
                    <div className="text-xl font-bold text-gray-900">{healthData.version}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Last Check</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {new Date(healthData.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Active Services</div>
                    <div className="text-xl font-bold text-green-600">
                      {Object.values(healthData.services).filter(s => s.status === 'up').length}/
                      {Object.keys(healthData.services).length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Unable to fetch system status</p>
            </div>
          )}
        </div>

        {/* Service Status Grid */}
        {healthData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI Service */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{t('dashboard.ai')}</h4>
                <div className={`p-2 rounded-lg ${getStatusColor(healthData.services.ai.status)}`}>
                  {getStatusIcon(healthData.services.ai.status)}
                </div>
              </div>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.services.ai.status)}`}>
                {healthData.services.ai.status === 'up' ? t('dashboard.up') : 
                 healthData.services.ai.status === 'down' ? t('dashboard.down') : 'Degraded'}
              </div>
              {healthData.services.ai.responseTime && (
                <div className="mt-3 text-sm text-gray-600">
                  {t('dashboard.responseTime')}: {formatResponseTime(healthData.services.ai.responseTime)}
                </div>
              )}
            </div>

            {/* Media Service */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{t('dashboard.media')}</h4>
                <div className={`p-2 rounded-lg ${getStatusColor(healthData.services.media.status)}`}>
                  {getStatusIcon(healthData.services.media.status)}
                </div>
              </div>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.services.media.status)}`}>
                {healthData.services.media.status === 'up' ? t('dashboard.up') : 
                 healthData.services.media.status === 'down' ? t('dashboard.down') : 'Degraded'}
              </div>
              {healthData.services.media.responseTime && (
                <div className="mt-3 text-sm text-gray-600">
                  {t('dashboard.responseTime')}: {formatResponseTime(healthData.services.media.responseTime)}
                </div>
              )}
            </div>

            {/* Drive Service */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{t('dashboard.drive')}</h4>
                <div className={`p-2 rounded-lg ${getStatusColor(healthData.services.drive.status)}`}>
                  {getStatusIcon(healthData.services.drive.status)}
                </div>
              </div>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.services.drive.status)}`}>
                {healthData.services.drive.status === 'up' ? t('dashboard.up') : 
                 healthData.services.drive.status === 'down' ? t('dashboard.down') : 'Degraded'}
              </div>
              {healthData.services.drive.responseTime && (
                <div className="mt-3 text-sm text-gray-600">
                  {t('dashboard.responseTime')}: {formatResponseTime(healthData.services.drive.responseTime)}
                </div>
              )}
            </div>

            {/* Database Service */}
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">{t('dashboard.database')}</h4>
                <div className={`p-2 rounded-lg ${getStatusColor(healthData.services.database.status)}`}>
                  {getStatusIcon(healthData.services.database.status)}
                </div>
              </div>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(healthData.services.database.status)}`}>
                {healthData.services.database.status === 'up' ? t('dashboard.up') : 
                 healthData.services.database.status === 'down' ? t('dashboard.down') : 'Degraded'}
              </div>
              {healthData.services.database.responseTime && (
                <div className="mt-3 text-sm text-gray-600">
                  {t('dashboard.responseTime')}: {formatResponseTime(healthData.services.database.responseTime)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display */}
        {healthQuery.isError && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-lg font-semibold text-red-800">System Status Unavailable</h4>
                <p className="text-red-700">Unable to connect to health check endpoint. Some services may be offline.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}