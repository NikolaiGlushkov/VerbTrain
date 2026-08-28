using System.ComponentModel.DataAnnotations; // используется для атрибутов Key и Required
// DataAnnotations.Schema тут нет, потому что он нужен для создания Foreign Key, связь настраивается в данном случае не стороне verb


namespace VerbTrainer.Models
{
    public class Language
    {
        [Key] // первичный ключ (primary key)
        public int Id { get; set; }

        [Required] // значит, что не может быть null, т е это обязательное поле
        [MaxLength(15)] // Для кодов "en", "de", "ru"
        public string Code { get; set; } = string.Empty;

        [Required] 
        [MaxLength(50)] // Для названий "English", "Deutsch" 
        public string Name { get; set; } = string.Empty;

        public virtual ICollection<Verb> Verbs { get; set; } = [];
    }
}
