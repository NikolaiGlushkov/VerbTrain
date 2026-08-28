using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.SqlServer.Server;
using Scalar.AspNetCore;
using VerbTrainer.Data;
using VerbTrainer.DTOs;
using VerbTrainer.Enums;
using VerbTrainer.Models;

var builder = WebApplication.CreateBuilder(args);

// настройка CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",      // для браузера
                "http://localhost",           // для Android
                "https://localhost",          // для Android
                "capacitor://localhost"       // для IOS
               )
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// подключение БД (user-secrets)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Настройки OpenAPI для Scalar
builder.Services.AddOpenApi();

var app = builder.Build();

// Инициализация Scalar документации 
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); 
}

app.UseHttpsRedirection();

// Активируем CORS
app.UseCors("AllowAngularDev");

// ЭНДПОИНТ (поиск по составному индексу)
// MapGet это minimal API, который не требует контроллеров и лишних оберток.
app.MapGet("/api/verbs", async (string langCode, byte level, AppDbContext db) =>
{
    var verbs = await db.Verbs
        .AsNoTracking() // Отключаем трекинг для скорости и экономии ОЗУ
        .Where(v => v.Language!.Code == langCode && v.Level == (LanguageLevel)level)
        .Select(v => new VerbDTO
        {
            Id = v.Id,
            Infinitive = v.Infinitive,
            LanguageLevel = v.Level,

            // Вытягиваем перевод (пока по умолчанию русский интерфейс!!!)
            Translation = v.Translations
                .Where(t => t.TargetLanguageCode == "ru")
                .Select(t => t.TranslationText)
                .FirstOrDefault() ?? string.Empty,

            // Собираем формы из таблицы VerbForms
            Form2 = v.Forms.Where(f => f.FormType == FormType.Form2).Select(f => f.Value).FirstOrDefault() ?? string.Empty,
            Form3 = v.Forms.Where(f => f.FormType == FormType.Form3).Select(f => f.Value).FirstOrDefault() ?? string.Empty,

            AuxiliaryVerb = v.Forms.Where(f => f.FormType == FormType.Auxiliary).Select(f => f.Value).FirstOrDefault(),

            // Разделяем дистракторы для V2 и V3 отдельно, чтобы Angular не путался
            Form2Distractors = v.Distractors.Where(d => d.FormType == FormType.Form2).Select(d => d.Value).ToList(),
            Form3Distractors = v.Distractors.Where(d => d.FormType == FormType.Form3).Select(d => d.Value).ToList()
        })
        .ToListAsync();// Неблокирующее вытягивание списка из базы данных

    return verbs.Count > 0 ? Results.Ok(verbs) : Results.NotFound(new { Message = "No verbs found for this language and level." });

    // 21.07 эксперимент с дополнительной защитой от падения angular
    // return verbs.Count > 0 ? Results.Ok(verbs) : Results.Ok(new List<VerbDTO>());
});


// Получаем контекст базы данных из контекста запроса/инициализации приложения
// Инициализация базы данных и сидинг при старте
// upsert с идемпотентностью
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Вызываем вынесенный метод автозаполнения
    DbInitializer.SeedVerbs(db);
}

app.Run();