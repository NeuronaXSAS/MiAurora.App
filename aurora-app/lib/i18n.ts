// Internationalization support for Aurora App
// Making the platform accessible to women worldwide

export type SupportedLocale = 
  | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'it' 
  | 'zh' | 'ja' | 'ko' | 'ar' | 'hi' | 'ru'
  | 'tr' | 'pl' | 'nl' | 'sv' | 'th' | 'vi';

export const SUPPORTED_LOCALES: Record<SupportedLocale, { name: string; nativeName: string; rtl?: boolean }> = {
  en: { name: 'English', nativeName: 'English' },
  es: { name: 'Spanish', nativeName: 'Español' },
  fr: { name: 'French', nativeName: 'Français' },
  de: { name: 'German', nativeName: 'Deutsch' },
  pt: { name: 'Portuguese', nativeName: 'Português' },
  it: { name: 'Italian', nativeName: 'Italiano' },
  zh: { name: 'Chinese', nativeName: '中文' },
  ja: { name: 'Japanese', nativeName: '日本語' },
  ko: { name: 'Korean', nativeName: '한국어' },
  ar: { name: 'Arabic', nativeName: 'العربية', rtl: true },
  hi: { name: 'Hindi', nativeName: 'हिन्दी' },
  ru: { name: 'Russian', nativeName: 'Русский' },
  tr: { name: 'Turkish', nativeName: 'Türkçe' },
  pl: { name: 'Polish', nativeName: 'Polski' },
  nl: { name: 'Dutch', nativeName: 'Nederlands' },
  sv: { name: 'Swedish', nativeName: 'Svenska' },
  th: { name: 'Thai', nativeName: 'ไทย' },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt' },
};

// Core translations for critical safety features
export const translations: Record<SupportedLocale, Record<string, string>> = {
  en: {
    // Emergency
    'emergency.panic': 'EMERGENCY',
    'emergency.imSafe': "I'm Safe",
    'emergency.help': 'Help is on the way',
    'emergency.contacts': 'Emergency Contacts',
    'emergency.addContact': 'Add Contact',
    
    // Safety
    'safety.checkin': 'Check In',
    'safety.imOk': "I'm OK",
    'safety.schedule': 'Schedule Check-in',
    'safety.missed': 'Missed Check-in',
    
    // Navigation
    'nav.feed': 'Feed',
    'nav.map': 'Safety Map',
    'nav.routes': 'Routes',
    'nav.emergency': 'Emergency',
    'nav.resources': 'Resources',
    'nav.circles': 'Circles',
    'nav.health': 'Health',
    'nav.profile': 'Profile',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.share': 'Share',
    'common.report': 'Report',
    'common.loading': 'Loading...',
    
    // Credits
    'credits.earned': 'Credits Earned',
    'credits.balance': 'Credit Balance',
  },
  es: {
    'emergency.panic': 'EMERGENCIA',
    'emergency.imSafe': 'Estoy a salvo',
    'emergency.help': 'La ayuda está en camino',
    'emergency.contacts': 'Contactos de Emergencia',
    'emergency.addContact': 'Agregar Contacto',
    'safety.checkin': 'Registrarse',
    'safety.imOk': 'Estoy bien',
    'safety.schedule': 'Programar registro',
    'safety.missed': 'Registro perdido',
    'nav.feed': 'Inicio',
    'nav.map': 'Mapa de Seguridad',
    'nav.routes': 'Rutas',
    'nav.emergency': 'Emergencia',
    'nav.resources': 'Recursos',
    'nav.circles': 'Círculos',
    'nav.health': 'Salud',
    'nav.profile': 'Perfil',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.submit': 'Enviar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.share': 'Compartir',
    'common.report': 'Reportar',
    'common.loading': 'Cargando...',
    'credits.earned': 'Créditos Ganados',
    'credits.balance': 'Saldo de Créditos',
  },
  fr: {
    'emergency.panic': 'URGENCE',
    'emergency.imSafe': 'Je suis en sécurité',
    'emergency.help': "L'aide arrive",
    'emergency.contacts': "Contacts d'urgence",
    'emergency.addContact': 'Ajouter un contact',
    'safety.checkin': 'Signalement',
    'safety.imOk': 'Je vais bien',
    'safety.schedule': 'Programmer un signalement',
    'safety.missed': 'Signalement manqué',
    'nav.feed': 'Fil',
    'nav.map': 'Carte de sécurité',
    'nav.routes': 'Itinéraires',
    'nav.emergency': 'Urgence',
    'nav.resources': 'Ressources',
    'nav.circles': 'Cercles',
    'nav.health': 'Santé',
    'nav.profile': 'Profil',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.submit': 'Soumettre',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.share': 'Partager',
    'common.report': 'Signaler',
    'common.loading': 'Chargement...',
    'credits.earned': 'Crédits gagnés',
    'credits.balance': 'Solde de crédits',
  },
  // Add more languages as needed - these are the critical safety terms
  de: {
    'emergency.panic': 'NOTFALL',
    'emergency.imSafe': 'Ich bin sicher',
    'emergency.help': 'Hilfe ist unterwegs',
    'safety.imOk': 'Mir geht es gut',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
  },
  pt: {
    'emergency.panic': 'EMERGÊNCIA',
    'emergency.imSafe': 'Estou segura',
    'emergency.help': 'Ajuda está a caminho',
    'safety.imOk': 'Estou bem',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
  },
  it: {
    'emergency.panic': 'EMERGENZA',
    'emergency.imSafe': 'Sono al sicuro',
    'emergency.help': "L'aiuto sta arrivando",
    'safety.imOk': 'Sto bene',
    'common.save': 'Salva',
    'common.cancel': 'Annulla',
  },
  zh: {
    'emergency.panic': '紧急情况',
    'emergency.imSafe': '我安全了',
    'emergency.help': '救援正在路上',
    'safety.imOk': '我没事',
    'common.save': '保存',
    'common.cancel': '取消',
  },
  ja: {
    'emergency.panic': '緊急事態',
    'emergency.imSafe': '安全です',
    'emergency.help': '助けが向かっています',
    'safety.imOk': '大丈夫です',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
  },
  ko: {
    'emergency.panic': '긴급상황',
    'emergency.imSafe': '안전해요',
    'emergency.help': '도움이 오고 있어요',
    'safety.imOk': '괜찮아요',
    'common.save': '저장',
    'common.cancel': '취소',
  },
  ar: {
    'emergency.panic': 'طوارئ',
    'emergency.imSafe': 'أنا بأمان',
    'emergency.help': 'المساعدة في الطريق',
    'safety.imOk': 'أنا بخير',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
  },
  hi: {
    'emergency.panic': 'आपातकाल',
    'emergency.imSafe': 'मैं सुरक्षित हूं',
    'emergency.help': 'मदद आ रही है',
    'safety.imOk': 'मैं ठीक हूं',
    'common.save': 'सहेजें',
    'common.cancel': 'रद्द करें',
  },
  ru: {
    'emergency.panic': 'ЭКСТРЕННАЯ СИТУАЦИЯ',
    'emergency.imSafe': 'Я в безопасности',
    'emergency.help': 'Помощь уже в пути',
    'safety.imOk': 'Я в порядке',
    'common.save': 'Сохранить',
    'common.cancel': 'Отмена',
  },
  tr: {
    'emergency.panic': 'ACİL DURUM',
    'emergency.imSafe': 'Güvendeyim',
    'emergency.help': 'Yardım yolda',
    'safety.imOk': 'İyiyim',
    'common.save': 'Kaydet',
    'common.cancel': 'İptal',
  },
  pl: {
    'emergency.panic': 'NAGŁY WYPADEK',
    'emergency.imSafe': 'Jestem bezpieczna',
    'emergency.help': 'Pomoc jest w drodze',
    'safety.imOk': 'Wszystko w porządku',
    'common.save': 'Zapisz',
    'common.cancel': 'Anuluj',
  },
  nl: {
    'emergency.panic': 'NOODGEVAL',
    'emergency.imSafe': 'Ik ben veilig',
    'emergency.help': 'Hulp is onderweg',
    'safety.imOk': 'Het gaat goed',
    'common.save': 'Opslaan',
    'common.cancel': 'Annuleren',
  },
  sv: {
    'emergency.panic': 'NÖDSITUATION',
    'emergency.imSafe': 'Jag är säker',
    'emergency.help': 'Hjälp är på väg',
    'safety.imOk': 'Jag mår bra',
    'common.save': 'Spara',
    'common.cancel': 'Avbryt',
  },
  th: {
    'emergency.panic': 'ฉุกเฉิน',
    'emergency.imSafe': 'ฉันปลอดภัย',
    'emergency.help': 'ความช่วยเหลือกำลังมา',
    'safety.imOk': 'ฉันสบายดี',
    'common.save': 'บันทึก',
    'common.cancel': 'ยกเลิก',
  },
  vi: {
    'emergency.panic': 'KHẨN CẤP',
    'emergency.imSafe': 'Tôi an toàn',
    'emergency.help': 'Trợ giúp đang đến',
    'safety.imOk': 'Tôi ổn',
    'common.save': 'Lưu',
    'common.cancel': 'Hủy',
  },
};

// Get browser locale
export function getBrowserLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'en';
  
  const browserLang = navigator.language.split('-')[0] as SupportedLocale;
  return SUPPORTED_LOCALES[browserLang] ? browserLang : 'en';
}

// Translation function
export function t(key: string, locale: SupportedLocale = 'en'): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}

// Check if locale is RTL
export function isRTL(locale: SupportedLocale): boolean {
  return SUPPORTED_LOCALES[locale]?.rtl || false;
}
