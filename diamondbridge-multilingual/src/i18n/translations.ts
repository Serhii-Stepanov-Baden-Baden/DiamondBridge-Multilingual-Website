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
      navigation: {
        title: 'Навигация',
        links: ['Главная', 'О нас', 'Услуги', 'Контакты']
      },
      project: {
        title: 'Проект',
        links: ['Проблема', 'Решение', 'Механика', 'Гениальные хабы']
      },
      contactChannels: {
        title: 'Каналы связи',
        links: ['ИИ Чат', 'Медиа Инструменты', 'Драйв', 'Панель Управления']
      },
      copyright: '© 2025 DiamondBridge. Все права защищены.',
      version: 'Версия 1.0.0',
      createdBy: 'Создано MiniMax Agent'
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
      navigation: {
        title: 'Navigation',
        links: ['Home', 'About', 'Services', 'Contact']
      },
      project: {
        title: 'Project',
        links: ['Problem', 'Solution', 'Mechanics', 'Genius Hubs']
      },
      contactChannels: {
        title: 'Contact Channels',
        links: ['AI Chat', 'Media Tools', 'Drive', 'Dashboard']
      },
      copyright: '© 2025 DiamondBridge. All rights reserved.',
      version: 'Version 1.0.0',
      createdBy: 'Created by MiniMax Agent'
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
      navigation: {
        title: 'Navigation',
        links: ['Startseite', 'Über uns', 'Dienstleistungen', 'Kontakt']
      },
      project: {
        title: 'Projekt',
        links: ['Problem', 'Lösung', 'Mechanik', 'Geniale Hubs']
      },
      contactChannels: {
        title: 'Kontaktkanäle',
        links: ['KI Chat', 'Medien Tools', 'Laufwerk', 'Dashboard']
      },
      copyright: '© 2025 DiamondBridge. Alle Rechte vorbehalten.',
      version: 'Version 1.0.0',
      createdBy: 'Erstellt von MiniMax Agent'
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
      navigation: {
        title: 'Navigation',
        links: ['Accueil', 'À propos', 'Services', 'Contact']
      },
      project: {
        title: 'Projet',
        links: ['Problème', 'Solution', 'Mécanique', 'Hubs de Génie']
      },
      contactChannels: {
        title: 'Canaux de Contact',
        links: ['Chat IA', 'Outils Média', 'Conduite', 'Tableau de Bord']
      },
      copyright: '© 2025 DiamondBridge. Tous droits réservés.',
      version: 'Version 1.0.0',
      createdBy: 'Créé par MiniMax Agent'
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
      navigation: {
        title: 'Navegación',
        links: ['Inicio', 'Acerca de', 'Servicios', 'Contacto']
      },
      project: {
        title: 'Proyecto',
        links: ['Problema', 'Solución', 'Mecánica', 'Centros de Genio']
      },
      contactChannels: {
        title: 'Canales de Contacto',
        links: ['Chat IA', 'Herramientas de Medios', 'Unidad', 'Panel de Control']
      },
      copyright: '© 2025 DiamondBridge. Todos los derechos reservados.',
      version: 'Versión 1.0.0',
      createdBy: 'Creado por MiniMax Agent'
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
      navigation: {
        title: 'Navigazione',
        links: ['Home', 'Chi siamo', 'Servizi', 'Contatti']
      },
      project: {
        title: 'Progetto',
        links: ['Problema', 'Soluzione', 'Meccanica', 'Hub di Genio']
      },
      contactChannels: {
        title: 'Canali di Contatto',
        links: ['Chat IA', 'Strumenti Media', 'Azionamento', 'Dashboard']
      },
      copyright: '© 2025 DiamondBridge. Tutti i diritti riservati.',
      version: 'Versione 1.0.0',
      createdBy: 'Creato da MiniMax Agent'
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
      drive: 'drive',
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
      navigation: {
        title: 'ナビゲーション',
        links: ['ホーム', '会社情報', 'サービス', 'お問い合わせ']
      },
      project: {
        title: 'プロジェクト',
        links: ['問題', '解決策', 'メカニズム', '天才ハブ']
      },
      contactChannels: {
        title: 'お問い合わせチャネル',
        links: ['AIチャット', 'メディアツール', 'drive', 'ダッシュボード']
      },
      copyright: '© 2025 DiamondBridge. 無断転載を禁じます。',
      version: 'バージョン 1.0.0',
      createdBy: '作成者 MiniMax Agent'
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
      navigation: {
        title: '导航',
        links: ['首页', '关于我们', '服务', '联系我们']
      },
      project: {
        title: '项目',
        links: ['问题', '解决方案', '机制', '天才中心']
      },
      contactChannels: {
        title: '联系渠道',
        links: ['AI聊天', '媒体工具', '驱动器', '仪表板']
      },
      copyright: '© 2025 DiamondBridge. 保留所有权利。',
      version: '版本 1.0.0',
      createdBy: '创建者 MiniMax Agent'
    }
  }
};

export default translations;
