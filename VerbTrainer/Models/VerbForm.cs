using System.ComponentModel.DataAnnotations;
using VerbTrainer.Enums;

namespace VerbTrainer.Models
{
    public class VerbForm
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int VerbId { get; set; }
        public virtual Verb? Verb { get; set; } // Связь с основным глаголом

        [Required]
        public FormType FormType { get; set; } 

        [Required]
        [MaxLength(50)]
        public string Value { get; set; } = string.Empty; // текст формы (напр "went")
    }
}
