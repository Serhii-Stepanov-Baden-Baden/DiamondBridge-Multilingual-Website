// translations.ts — Многоязычные переводы для DiamondBridge
import { Language } from './Context';

export type TranslationKey = string;

export const getTranslation = (lang: Language, key: string): string => {
  const getNestedValue = (obj: any, path: string[]): any =>
    path.reduce((acc, part) => acc?.[part], obj);
  
  const path = key.split('.');
  const value = getNestedValue(translations[lang], path);
  
  return typeof value === 'string' ? value : key;
};

export const translations: Record<Language, any> = {
  ru: {
    nav: {
      home: 'Главная',
      about: 'О нас',
      services: 'Услуги',
      contact: 'Контакты',
      problem: 'Проблема',
      solution: 'Решение',
      mechanics: 'Механика',
      geniusHubs: 'Гениальные хабы',
      aiChat: 'ИИ Чат',
      mediaTools: 'Медиа Инструменты',
      drive: 'Драйв',
      dashboard: 'Панель Управления',
      contacts: 'Контакты',
      contactUs: 'Связаться'
    },
    home: {
      hero: {
        title: 'DiamondBridge',
        subtitle: 'Объединяем людей, идеи и технологии',
        description: 'Инновационная платформа для создания связей и развития талантов'
      },
      features: {
        multilingual: 'Многоязычность',
        ai: 'ИИ интеграция',
        performance: 'Высокая производительность'
      }
    },
    footer: {
      navigation: 'Навигация',
      project: 'Проект',
      contactChannels: 'Каналы связи',
      copyright: '© 2025 DiamondBridge. Все права защищены.',
      version: 'Версия',
      createdBy: 'Создано'
    }
  },
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      services: 'Services',
      contact: 'Contact',
      problem: 'Problem',
      solution: 'Solution',
      mechanics: 'Mechanics',
      geniusHubs: 'Genius Hubs',
      aiChat: 'AI Chat',
      mediaTools: 'Media Tools',
      drive: 'Drive',
      dashboard: 'Dashboard',
      contacts: 'Contacts',
      contactUs: 'Contact Us'
    },
    home: {
      hero: {
        title: 'DiamondBridge',
        subtitle: 'Connecting people, ideas, and technology',
        description: 'Innovative platform for creating connections and developing talents'
      },
      features: {
        multilingual: 'Multilingual',
        ai: 'AI Integration',
        performance: 'High Performance'
      }
    },
    footer: {
      navigation: 'Navigation',
      project: 'Project',
      contactChannels: 'Contact Channels',
      copyright: '© 2025 DiamondBridge. All rights reserved.',
      version: 'Version',
      createdBy: 'Created by'
    }
  },
  de: {
    nav: {
      home: 'Startseite',
      about: 'Über uns',
      services: 'Dienstleistungen',
      contact: 'Kontakt',
      problem: 'Problem',
      solution: 'Lösung',
      mechanics: 'Mechanik',
      geniusHubs: 'Geniale Hubs',
      aiChat: 'KI Chat',
      mediaTools: 'Medien Tools',
      drive: 'Laufwerk',
      dashboard: 'Dashboard',
      contacts: 'Kontakte',
      contactUs: 'Kontaktieren Sie uns'
    },
    home: {
      hero: {
        title: 'DiamondBridge',
        subtitle: 'Menschen, Ideen und Technologie verbinden',
        description: 'Innovative Plattform für Verbindungen und Talententwicklung'
      },
      features: {
        multilingual: 'Mehrsprachig',
        ai: 'KI Integration',
        performance: 'Hohe Leistung'
      }
    },
    footer: {
      navigation: 'Navigation',
      project: 'Projekt',
      contactChannels: 'Kontaktkanäle',
      copyright: '© 2025 DiamondBridge. Alle Rechte vorbehalten.',
      version: 'Version',
      createdBy: 'Erstellt von'
    }
  },
  fr: {
    nav: {
      home: 'Accueil',
      about: 'À propos',
      services: 'Services',
      contact: 'Contact',
      problem: 'Problème',
      solution: 'Solution',
      mechanics: 'Mécanique',
      geniusHubs: 'Hubs de Génie',
      aiChat: 'Chat IA',
      mediaTools: 'Outils Média',
      drive: 'Conduite',
      dashboard: 'Tableau de Bord',
      contacts: 'Contacts',
      contactUs: 'Nous Contacter'
    },
    home: {
      hero: {
        title: 'DiamondBridge',
        subtitle: 'Connecter les personnes, les idées et la technologie',
        description: 'Plateforme innovante pour créer des connexions et développer des talents'
      },
      features: {
        multilingual: 'Multilingue',
        ai: 'Intégration IA',
        performance: 'Haute Performance'
      }
    },
    footer: {
      navigation: 'Navigation',
      project: 'Projet',
      contactChannels: 'Canaux de Contact',
      copyright: '© 2025 DiamondBridge. Tous droits réservés.',
      version: 'Version',
      createdBy: 'Créé par'
    }
  },
  es: {
    nav: {
      home: 'Inicio',
      about: 'Acerca de',
      services: 'Servicios',
      contact: 'Contacto',
      problem: 'Problema',
      solution: 'Solución',
      mechanics: 'Mecánica',
      geniusHubs: 'Centros de Genio',
      aiChat: 'Chat IA',
      mediaTools: 'Herramientas de Medios',
      drive: 'Unidad',
      dashboard: 'Panel de Control',
      contacts: 'Contactos',
      contactUs: 'Contáctanos'
    },
    home: {
      hero: {
        title: 'DiamondBridge',
        subtitle: 'Conectar personas, ideas y tecnología',
        description: 'Plataforma innovadora para crear conexiones y desarrollar talentos'
      },
      features: {
        multilingual: 'Multilingüe',
        ai: 'Integración IA',
        performance: 'Alto Rendimiento'
      }
    },
    footer: {
      navigation: 'Navegación',
      project: 'Proyecto',
      contactChannels: 'Canales de Contacto',
      copyright: '© 2025 DiamondBridge. Todos los derechos reservados.',
      version: 'Versión',
      createdBy: 'Creado por'
    }
  },
  it: {
    nav: {
      home: 'Home',
      about: 'Chi siamo',
      services: 'Servizi',
      contact: 'Contatti',
      problem: 'Problema',
      solution: 'Soluzione',
      mechanics: 'Meccanica',
      geniusHubs: 'Hub di Genio',
      aiChat: 'Chat IA',
      mediaTools: 'Strumenti Media',
      drive: 'Azionamento',
      dashboard: 'Dashboard',
      contacts: 'Contatti',
      contactUs: 'Contattaci'
    },
    home: {
      hero: {
        title: 'DiamondBridge',
        subtitle: 'Connettere persone, idee e tecnologia',
        description: 'Piattaforma innovativa per creare connessioni e sviluppare talenti'
      },
      features: {
        multilingual: 'Multilingue',
        ai: 'Integrazione IA',
        performance: 'Alte Prestazioni'
      }
    },
    footer: {
      navigation: 'Navigazione',
      project: 'Progetto',
      contactChannels: 'Canali di Contatto',
      copyright: '© 2025 DiamondBridge. Tutti i diritti riservati.',
      version: 'Versione',
      createdBy: 'Creato da'
    }
  },
  ja: {
    nav: {
      home: 'ホーム',
      about: '会社情報',
      services: 'サービス',
      contact: 'お問い合わせ',
      problem: '問題',
      solution: '解決策',
      mechanics: 'メカニズム',
      geniusHubs: '天才ハブ',
      aiChat: 'AIチャット',
      mediaTools: 'メディアツール',
      drive: ' drive',
      dashboard: 'ダッシュボード',
      contacts: '連絡先',
      contactUs: 'お問い合わせ'
    },
    home: {
      hero: {
        title: 'DiamondBridge',
        subtitle: '人々、アイデア、技術を結ぶ',
        description: 'つながりを創り才能を開発する革新的プラットフォーム'
      },
      features: {
        multilingual: '多言語対応',
        ai: 'AI統合',
        performance: '高性能'
      }
    },
    footer: {
      navigation: 'ナビゲーション',
      project: 'プロジェクト',
      contactChannels: 'お問い合わせチャネル',
      copyright: '© 2025 DiamondBridge. 無断転載を禁じます。',
      version: 'バージョン',
      createdBy: '作成者'
    }
  },
  zh: {
    nav: {
      home: '首页',
      about: '关于我们',
      services: '服务',
      contact: '联系我们',
      problem: '问题',
      solution: '解决方案',
      mechanics: '机制',
      geniusHubs: '天才中心',
      aiChat: 'AI聊天',
      mediaTools: '媒体工具',
      drive: '驱动器',
      dashboard: '仪表板',
      contacts: '联系方式',
      contactUs: '联系我们'
    },
    home: {
      hero: {
        title: 'DiamondBridge',
        subtitle: '连接人、思想和科技',
        description: '创建连接和培养人才的创新平台'
      },
      features: {
        multilingual: '多语言',
        ai: 'AI集成',
        performance: '高性能'
      }
    },
    footer: {
      navigation: '导航',
      project: '项目',
      contactChannels: '联系渠道',
      copyright: '© 2025 DiamondBridge. 保留所有权利。',
      version: '版本',
      createdBy: '创建者'
    }
  }
};

export default translations;
