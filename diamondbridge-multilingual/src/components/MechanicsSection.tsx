import React from 'react';
import { useI18n } from '../i18n/Context';

export function MechanicsSection() {
  const { t } = useI18n();

  const steps = t('solution.steps') as string[];

  return (
    <section id="mechanics" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            {t('solution.title')}
          </h2>
          <p className="text-xl text-gray-600">
            {t('solution.subtitle')}
          </p>
        </div>

        {/* Detailed Mechanics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Step {index + 1}
                  </h3>
                  <p className="text-gray-600">{step}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {t('mechanics.title')}
            </h3>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-blue-600 mb-2">{t('mechanics.blockchain.title')}</h4>
                <p className="text-sm text-gray-600">{t('mechanics.blockchain.description')}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-green-600 mb-2">{t('mechanics.ai.title')}</h4>
                <p className="text-sm text-gray-600">{t('mechanics.ai.description')}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold text-purple-600 mb-2">{t('mechanics.ecosystem.title')}</h4>
                <p className="text-sm text-gray-600">{t('mechanics.ecosystem.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}