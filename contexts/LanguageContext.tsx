import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LangCode = 'en' | 'fr' | 'es' | 'ar' | 'sw';

// ── Translations ──────────────────────────────────────────────────────────────
// Add any string your app needs here. Keep keys identical across languages.
const translations: Record<LangCode, Record<string, string>> = {
  en: {
    settings: 'Settings',
    profile: 'Profile',
    editDetails: 'Edit your details',
    password: 'Password',
    changePassword: 'Change password',
    notifications: 'Notifications',
    budgetAlerts: 'Budget alerts',
    currency: 'Currency',
    language: 'Language',
    theme: 'Theme',
    api: 'API',
    version: 'Version',
    logout: 'Log out',
    logoutConfirm: 'Are you sure?',
    cancel: 'Cancel',
    selectCurrency: 'Select Currency',
    searchCurrency: 'Search currency...',
    noCurrencies: 'No currencies found',
    updatingCurrency: 'Updating currency...',
    currencyUpdated: 'Currency changed to',
    selectLanguage: 'Select Language',
    selectTheme: 'Select Theme',
    languageUpdated: 'Language set to',
    themeUpdated: 'Theme set to',
    account: 'Account',
    app: 'App',
    info: 'Info',
    free: 'Free',
  },
  fr: {
    settings: 'Paramètres',
    profile: 'Profil',
    editDetails: 'Modifier vos informations',
    password: 'Mot de passe',
    changePassword: 'Changer le mot de passe',
    notifications: 'Notifications',
    budgetAlerts: 'Alertes de budget',
    currency: 'Devise',
    language: 'Langue',
    theme: 'Thème',
    api: 'API',
    version: 'Version',
    logout: 'Se déconnecter',
    logoutConfirm: 'Êtes-vous sûr ?',
    cancel: 'Annuler',
    selectCurrency: 'Choisir une devise',
    searchCurrency: 'Rechercher une devise...',
    noCurrencies: 'Aucune devise trouvée',
    updatingCurrency: 'Mise à jour de la devise...',
    currencyUpdated: 'Devise changée en',
    selectLanguage: 'Choisir une langue',
    selectTheme: 'Choisir un thème',
    languageUpdated: 'Langue définie sur',
    themeUpdated: 'Thème défini sur',
    account: 'Compte',
    app: 'Application',
    info: 'Infos',
    free: 'Gratuit',
  },
  es: {
    settings: 'Ajustes',
    profile: 'Perfil',
    editDetails: 'Editar tus datos',
    password: 'Contraseña',
    changePassword: 'Cambiar contraseña',
    notifications: 'Notificaciones',
    budgetAlerts: 'Alertas de presupuesto',
    currency: 'Moneda',
    language: 'Idioma',
    theme: 'Tema',
    api: 'API',
    version: 'Versión',
    logout: 'Cerrar sesión',
    logoutConfirm: '¿Estás seguro?',
    cancel: 'Cancelar',
    selectCurrency: 'Seleccionar moneda',
    searchCurrency: 'Buscar moneda...',
    noCurrencies: 'No se encontraron monedas',
    updatingCurrency: 'Actualizando moneda...',
    currencyUpdated: 'Moneda cambiada a',
    selectLanguage: 'Seleccionar idioma',
    selectTheme: 'Seleccionar tema',
    languageUpdated: 'Idioma definido como',
    themeUpdated: 'Tema definido como',
    account: 'Cuenta',
    app: 'Aplicación',
    info: 'Info',
    free: 'Gratis',
  },
  ar: {
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    editDetails: 'تعديل بياناتك',
    password: 'كلمة المرور',
    changePassword: 'تغيير كلمة المرور',
    notifications: 'الإشعارات',
    budgetAlerts: 'تنبيهات الميزانية',
    currency: 'العملة',
    language: 'اللغة',
    theme: 'المظهر',
    api: 'API',
    version: 'الإصدار',
    logout: 'تسجيل الخروج',
    logoutConfirm: 'هل أنت متأكد؟',
    cancel: 'إلغاء',
    selectCurrency: 'اختر العملة',
    searchCurrency: 'بحث عن عملة...',
    noCurrencies: 'لا توجد عملات',
    updatingCurrency: 'جارٍ تحديث العملة...',
    currencyUpdated: 'تم تغيير العملة إلى',
    selectLanguage: 'اختر اللغة',
    selectTheme: 'اختر المظهر',
    languageUpdated: 'تم ضبط اللغة على',
    themeUpdated: 'تم ضبط المظهر على',
    account: 'الحساب',
    app: 'التطبيق',
    info: 'معلومات',
    free: 'مجاني',
  },
  sw: {
    settings: 'Mipangilio',
    profile: 'Wasifu',
    editDetails: 'Hariri maelezo yako',
    password: 'Nenosiri',
    changePassword: 'Badilisha nenosiri',
    notifications: 'Arifa',
    budgetAlerts: 'Arifa za bajeti',
    currency: 'Sarafu',
    language: 'Lugha',
    theme: 'Mandhari',
    api: 'API',
    version: 'Toleo',
    logout: 'Toka',
    logoutConfirm: 'Una uhakika?',
    cancel: 'Ghairi',
    selectCurrency: 'Chagua sarafu',
    searchCurrency: 'Tafuta sarafu...',
    noCurrencies: 'Hakuna sarafu zilizopatikana',
    updatingCurrency: 'Inasasisha sarafu...',
    currencyUpdated: 'Sarafu imebadilishwa kuwa',
    selectLanguage: 'Chagua lugha',
    selectTheme: 'Chagua mandhari',
    languageUpdated: 'Lugha imewekwa kuwa',
    themeUpdated: 'Mandhari imewekwa kuwa',
    account: 'Akaunti',
    app: 'Programu',
    info: 'Maelezo',
    free: 'Bure',
  },
};

// ── Context ───────────────────────────────────────────────────────────────────
interface LanguageContextValue {
  langCode: LangCode;
  setLangCode: (code: LangCode) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  langCode: 'en',
  setLangCode: () => {},
  t: (key) => key,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [langCode, setLangCodeState] = useState<LangCode>('en');

  useEffect(() => {
    AsyncStorage.getItem('app_language').then((saved) => {
      if (saved && saved in translations) {
        setLangCodeState(saved as LangCode);
      }
    });
  }, []);

  const setLangCode = async (code: LangCode) => {
    setLangCodeState(code);
    await AsyncStorage.setItem('app_language', code);
  };

  const t = (key: string): string =>
    translations[langCode]?.[key] ?? translations['en']?.[key] ?? key;

  const isRTL = langCode === 'ar';

  return (
    <LanguageContext.Provider value={{ langCode, setLangCode, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
