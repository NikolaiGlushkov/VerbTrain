using VerbTrainer.Enums;

namespace VerbTrainer.DTOs
{
    // Data Transfer Objects
    public class VerbDTO
    {
        public int Id { get; set; }
        public string Infinitive { get; set; } = string.Empty;
        // 21 07 переименовал Level на LanguageLevel
        public LanguageLevel LanguageLevel { get; set; } // Отдаем Enum числом 

        // Бэкенд вытащит это из таблицы VerbForms и положит сюда:
        public string Form2 { get; set; } = string.Empty;  
        public string Form3 { get; set; } = string.Empty; 
        public string? AuxiliaryVerb { get; set; } // вспомогательный глагол для немецкого


        // Ловушки, разделенные по типам форм!
        public List<string> Form2Distractors { get; set; } = []; // новый синтакис инициализации
        public List<string> Form3Distractors { get; set; } = [];

        // Бэкенд вытащит перевод для выбранного языка
        public string Translation { get; set; } = string.Empty;

    }

 
}
