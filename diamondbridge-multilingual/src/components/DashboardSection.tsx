import React from 'react';
import { useLanguage } from '../i18n/Context';

export function DashboardSection() {
  const { t } = useLanguage();

  const mockStatus = 'healthy'; // можно заменить на 'degraded', 'down', 'unknown'
  const mockUptime = '3d 4h 12m';
  const mockResponseTime = '850ms';

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
        return <div className="w-5 h-5 rounded-full bg-green-500" />;
      case 'degraded':
        return <div className="w-5 h-5 rounded-full bg-yellow-500" />;
      case 'unhealthy':
      case 'down':
        return <div className="w-5 h-5 rounded-full bg-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-500" />;
    }
  };

  return (
    <section id="dashboard" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-6">{t('dashboard.title') || 'System Dashboard'}</h2>
        <div className={`inline-flex items-center gap-3 px-4 py-2 rounded ${getStatusColor(mockStatus)}`}>
          {getStatusIcon(mockStatus)}
          <span className="font-medium">{t('dashboard.status') || 'Status'}: {mockStatus}</span>
        </div>
        <p className="mt-4 text-gray-700">{t('dashboard.uptime') || 'Uptime'}: {mockUptime}</p>
        <p className="text-gray-700">{t('dashboard.responseTime') || 'Response Time'}: {mockResponseTime}</p>
      </div>
    </section>
  );
}
