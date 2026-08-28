
// export это аналог public для других папок - services и components
// в js/ts поля пишутся с маленькой буквы
// 21.07 это самый важный класс--тут должна быть копия бекенд ответа!
//  export interface IVerb 
//  {
//      id: number;
//      languageId: number;       
//      infinitive: string;
//      form2: string;
//      form3: string;
//      auxiliaryVerb?: string;   // используется nullable, как и в модели бекэнда
//      translation: string;
//      languageLevel: string;
//  }

export interface IVerb {
   id: number;
   infinitive: string;
   languageLevel: number; // Отдаем Enum числом (1, 2, 3...)
   form2: string;
   form3: string;
   auxiliaryVerb?: string | null; // Nullable для английского, строка для немецкого

   // Ловушки, прилетающие с бэкенда для генерации квиза
   form2Distractors: string[];
   form3Distractors: string[];

   // Финальный текст перевода для пользователя
   translation: string;
}
