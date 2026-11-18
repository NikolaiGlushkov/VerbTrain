// 21.07 этот класс-- копия бекенд ответа!    
export interface IVerb {
   id: number;
   infinitive: string;
   languageLevel: number; 
   form2: string;
   form3: string;
   auxiliaryVerb?: string | null; // Nullable для английского, строка для немецкого

   // Ловушки, прилетающие с бэкенда для генерации квиза
   form2Distractors: string[];
   form3Distractors: string[];

   // Финальный текст перевода для пользователя
   translation: string;
}
