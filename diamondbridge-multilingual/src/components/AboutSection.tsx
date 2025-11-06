import React from 'react';
import { useI18n } from '../i18n/Context';

export function AboutSection() {
  const { t } = useI18n();

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {t('about.title')}
            </h2>
            <div className="space-y-6 text-gray-600">
              <p className="text-lg leading-relaxed">
                {t('about.content.paragraph1')}
              </p>
              <p className="text-lg leading-relaxed">
                {t('about.content.paragraph2')}
              </p>
              <p className="text-lg leading-relaxed">
                {t('about.content.paragraph3')}
              </p>
            </div>

            {/* Core Values */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Core Values</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-700">{t('about.values.transparency')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-gray-700">{t('about.values.fairness')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                  <span className="text-gray-700">{t('about.values.innovation')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                  <span className="text-gray-700">{t('about.values.protection')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {t('about.mission.title')}
            </h3>
            <blockquote className="text-lg italic text-gray-600 mb-6 border-l-4 border-blue-600 pl-6">
              "{t('about.mission.description')}"
            </blockquote>

            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{t('about.mission.missionTitle')}</h4>
                  <p className="text-gray-600 text-sm">{t('about.mission.missionDescription')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{t('about.mission.visionTitle')}</h4>
                  <p className="text-gray-600 text-sm">{t('about.mission.visionDescription')}</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{t('about.mission.impactTitle')}</h4>
                  <p className="text-gray-600 text-sm">{t('about.mission.impactDescription')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}