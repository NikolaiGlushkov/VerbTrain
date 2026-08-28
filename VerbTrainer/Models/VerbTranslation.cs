using System.ComponentModel.DataAnnotations;

// названия полей в модели и джейсоне должны полностью совпадать
namespace VerbTrainer.Models
{
    public class VerbTranslation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int VerbId { get; set; }
        public virtual Verb? Verb { get; set; } // Связь с основным глаголом

        [Required]
        [MaxLength(10)]
        // Код языка, на который переводим ("ru", "de")
        public string TargetLanguageCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string TranslationText { get; set; } = string.Empty; // Сам перевод
    }
}
