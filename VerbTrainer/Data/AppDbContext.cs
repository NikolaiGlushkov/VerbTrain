using Microsoft.EntityFrameworkCore;
using VerbTrainer.Models;

namespace VerbTrainer.Data;

// это класс EF! Он изолирует нас от SQL 
// тут перечислены все модели
public class AppDbContext : DbContext 
{
    // Этот конструктор нужен, чтобы ASP.NET мог передать строку подключения в EF
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Регистрируем наши таблицы в базе данных
    public DbSet<Language> Languages => Set<Language>();
    public DbSet<Verb> Verbs => Set<Verb>();
    public DbSet<VerbForm> VerbForms => Set<VerbForm>();
    public DbSet<VerbTranslation> VerbTranslations => Set<VerbTranslation>();
    public DbSet<VerbDistractor> VerbDistractors => Set<VerbDistractor>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Индекс скорости для квизов
        modelBuilder.Entity<Verb>()
            .HasIndex(v => new { v.LanguageId, v.Level })
            .HasDatabaseName("IX_Verb_LanguageId_Level");
    }
}
