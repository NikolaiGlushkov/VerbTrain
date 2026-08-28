using System.ComponentModel.DataAnnotations; // используется для атрибутов Key и Required
using System.ComponentModel.DataAnnotations.Schema; // нужен только для Foreign Key. поэтому не нужен
using VerbTrainer.Enums;

namespace VerbTrainer.Models 
    // подход code-first. мы пишем класс Verb, а EF по этому чертежу создает реальную таблицу.-
    // связующее звено между моделью и бд--это класс AppDbContext
{
    public class Verb
    {
        [Key] // Primary Key
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Infinitive { get; set; } = string.Empty;

        [Required]
        public LanguageLevel Level { get; set; } // Enum 

        [Required]
        public int LanguageId { get; set; } // у каждого языка связь с глаголами один ко многим
        public virtual Language? Language { get; set; } // навигационное свойство

        // Навигационные свойства для связанных таблиц (EF Core сам сделает JOIN)
        public virtual ICollection<VerbForm> Forms { get; set; } = [];
        public virtual ICollection<VerbTranslation> Translations { get; set; } = [];
        public virtual ICollection<VerbDistractor> Distractors { get; set; } = [];
    }
}
