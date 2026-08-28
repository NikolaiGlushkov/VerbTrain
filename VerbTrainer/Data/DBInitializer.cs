using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using VerbTrainer.DTOs;
using VerbTrainer.Models;

namespace VerbTrainer.Data
{
    // UPSERT -- метод заполнения, паттерн Data Seeding, который безопасно обновляет существующие записи и добавляет новые.
    public static class DbInitializer
    {
        public static void SeedVerbs(AppDbContext db)
        {
            // миграции при старте приложения (база создастся сама, если её нет)
            db.Database.Migrate();

            // Для масштабирования языков
            var languagesToSeed = new[]
            {
                new { Code = "en", Name = "English", FileName = "verbs_en.json" },
                //new { Code = "de", Name = "Deutsch", FileName = "verbs_de.json" }
            };

            foreach (var langConfig in languagesToSeed)
            {
                var jsonPath = Path.Combine(AppContext.BaseDirectory, langConfig.FileName);
                if (!File.Exists(jsonPath)) continue;

                // Ищем или создаем язык в БД
                var language = db.Languages.FirstOrDefault(l => l.Code == langConfig.Code);
                if (language == null)
                {
                    language = new Language { Code = langConfig.Code, Name = langConfig.Name };
                    db.Languages.Add(language);
                    db.SaveChanges(); // Сохраняем сразу, чтобы сгенерировать LanguageId для связей
                }

                // Читаем и десериализуем данные конкретного языка в наши DTO
                // 1.1 добавить асинхронность
                var jsonString = File.ReadAllText(jsonPath);
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var rawVerbs = JsonSerializer.Deserialize<List<VerbJsonModel>>(jsonString, options);

                if (rawVerbs == null) continue;

                // Выкачиваем существующие глаголы для текущего языка в Словарь O(1)
                // AsSplitQuery добавлен позже
                // 1.1 добавить синхронизацию БД с json, в тч защиту от двойников, 
                //     возможно это можно найти в расширениях, напр EFCore.BulkExtensions
                var allExistingVerbs = db.Verbs
                    .AsSplitQuery()
                    .Include(v => v.Forms)
                    .Include(v => v.Translations)
                    .Include(v => v.Distractors)
                    .Where(v => v.LanguageId == language.Id)
                    .ToDictionary(v => v.Infinitive);

                foreach (var jsonVerb in rawVerbs)
                {
                    if (!allExistingVerbs.TryGetValue(jsonVerb.Infinitive, out var existingVerb))
                    {
                        // инсерт нового глагола
                        var newVerb = new Verb
                        {
                            Infinitive = jsonVerb.Infinitive,
                            Level = jsonVerb.Level,
                            LanguageId = language.Id,
                            Forms = jsonVerb.Forms.Select(f => new VerbForm { FormType = f.FormType, Value = f.Value }).ToList(),
                            Translations = jsonVerb.Translations.Select(t => new VerbTranslation { TargetLanguageCode = t.TargetLanguageCode, TranslationText = t.TranslationText }).ToList(),
                            Distractors = jsonVerb.Distractors.DistinctBy(d => new { d.FormType, d.Value }).Select(d => new VerbDistractor { FormType = d.FormType, Value = d.Value }).ToList()
                        };
                        db.Verbs.Add(newVerb);
                    }
                    else
                    {
                        // апдейт существующего глагола
                        existingVerb.Level = jsonVerb.Level;

                        // Безопасное обновление форм
                        db.RemoveRange(existingVerb.Forms); // Явно говорим БД удалить старые строки
                        existingVerb.Forms.Clear();         // Очищаем текущую коллекцию, сохраняя её экземпляр
                        foreach (var f in jsonVerb.Forms)
                        {
                            existingVerb.Forms.Add(new VerbForm { FormType = f.FormType, Value = f.Value });
                        }

                        // Безопасное обновление переводов
                        db.RemoveRange(existingVerb.Translations);
                        existingVerb.Translations.Clear();
                        foreach (var t in jsonVerb.Translations)
                        {
                            existingVerb.Translations.Add(new VerbTranslation { TargetLanguageCode = t.TargetLanguageCode, TranslationText = t.TranslationText });
                        }

                        // Безопасное обновление дистракторов
                        db.RemoveRange(existingVerb.Distractors);
                        existingVerb.Distractors.Clear();
                        // Фильтруем дубликаты перед добавлением в коллекцию
                        var uniqueDistractors = jsonVerb.Distractors.DistinctBy(d => new { d.FormType, d.Value });
                        foreach (var d in uniqueDistractors)
                        {
                            existingVerb.Distractors.Add(new VerbDistractor { FormType = d.FormType, Value = d.Value });
                        }
                    }
                    // 2080 оставляем в коллекции только актуальные глаголы из json
                    //allExistingVerbs.Remove(jsonVerb.Infinitive);
                }

                // 2080 удаляем глаголы, которых больше нет в json
                //db.Verbs.RemoveRange(allExistingVerbs.Values);

                // Сохраняем все инсерты и апдейты для текущего языка одной быстрой транзакцией
                db.SaveChanges();
            }
        }
    }
}
