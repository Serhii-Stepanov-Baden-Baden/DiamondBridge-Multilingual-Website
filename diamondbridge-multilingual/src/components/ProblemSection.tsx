import React from 'react';
import { useLanguage } from '../i18n/Context';

export function ProblemSection() {
  const { t } = useLanguage();

  const items = t('problem.items') as string[];

  return (
    <section id="problem" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {t('problem.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {t('problem.description')}
          </p>
        </div>

        {/* What's Lost Section */}
        <div className="bg-red-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-red-800 mb-8 text-center">
            {t('problem.whatsLost')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
