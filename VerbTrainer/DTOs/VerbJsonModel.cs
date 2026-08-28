using VerbTrainer.Enums;

namespace VerbTrainer.DTOs
{
    /// <summary>
    /// DTO для точного маппинга и десериализации входящего JSON-файла.
    /// </summary>
    public class VerbJsonModel
    {
        public string Infinitive { get; set; } = string.Empty;
        public LanguageLevel Level { get; set; }
        public List<FormJsonModel> Forms { get; set; } = [];
        public List<TranslationJsonModel> Translations { get; set; } = [];
        public List<DistractorJsonModel> Distractors { get; set; } = [];
    }

    public class FormJsonModel
    {
        public FormType FormType { get; set; }
        public string Value { get; set; } = string.Empty;
    }

    public class TranslationJsonModel
    {
        public string TargetLanguageCode { get; set; } = string.Empty;
        public string TranslationText { get; set; } = string.Empty;
    }

    public class DistractorJsonModel
    {
        public FormType FormType { get; set; }
        public string Value { get; set; } = string.Empty;
    }
}
