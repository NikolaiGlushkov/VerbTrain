import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerbService } from '../../services/verb.service';
import { IVerb } from '../../models/verb.model';
import { LanguageLevel } from '../../models/language-level.enum';
import { shuffleArray } from '../../helpers/shuffle.helper';
import { take } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressService } from '../../services/progress.service';

// локализация
const TRANSLATIONS: Record<string, Record<string, string>> = {
  ru: {
    check: 'Проверить',
    awesome: 'Отлично!',
    correct_desc: 'Вы ответили правильно.',
    error: 'Ошибка',
    correct_was: 'Правильный ответ',
    continue: 'Дальше',
    level_passed: 'Уровень пройден! ',
    next_unlocked: 'Следующий уровень успешно разблокирован.',
    game_over: 'Игра окончена! ',
    try_again_desc: 'У вас закончились жизни. Попробуйте еще раз.',
    retry: 'Повторить',
    menu: 'В главное меню'
  },
  en: {
    check: 'Check',
    awesome: 'Awesome!',
    correct_desc: 'Your answer is correct.',
    error: 'Error',
    correct_was: 'Correct answer',
    continue: 'Continue',
    level_passed: 'Level Completed! ',
    next_unlocked: 'The next language level is now unlocked.',
    game_over: 'Game Over! ',
    try_again_desc: 'You have run out of lives. Please try again.',
    retry: 'Try Again',
    menu: 'To the Main Menu'
  }
};

@Component({
  selector: 'app-trainer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trainer.component.html',
  styleUrl: './trainer.component.css'
})
export class TrainerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private progressService = inject(ProgressService);
  private verbService = inject(VerbService);

  // это 2 обычные переменные, а не сигналы!
  verbsList: IVerb[] = [];
  currentLanguageCode: string = ''; // был хардкод ru

  currentVerb = signal<IVerb | null>(null);
  currentVerbIndex = signal<number>(0);
  totalVerbs = signal<number>(0);

  testingFormNumber = signal<2 | 3>(2);
  quizOptions = signal<string[]>([]);
  selectedAnswer = signal<string | null>(null);

  lives = signal<number>(3);
  isAnswerChecked = signal<boolean>(false);
  isCurrentAnswerCorrect = signal<boolean>(false);

  // Состояния промежуточных экранов 
  isLevelFinished = signal<boolean>(false);
  isGameOver = signal<boolean>(false);

  selectedLanguage = signal<string>('');
  selectedLevel = signal<number>(0);

  ngOnInit(): void {
    this.initInterfaceLanguage();
    this.loadCurrentLevelData();
  }

  // Автоопределение языка телефона для интерфейса
  // доделать в след версиях
  private initInterfaceLanguage(): void {
    const deviceLang = navigator.language.split('-')[0];
    // Если язык поддерживается — ставим его, иначе дефолтный русский
    // this.currentLanguageCode = TRANSLATIONS[deviceLang] ? deviceLang : 'ru';
    this.currentLanguageCode = 'ru';
  }

  // Функция-переводчик для HTML шаблона
  // в след версиях перенести в сервис локализации
  public t(key: string): string {
    return TRANSLATIONS[this.currentLanguageCode]?.[key] || key;
  }

  // Динамическое получение имени уровня из Enum 
  public getLevelName(): string {
    const levelNum = this.selectedLevel();
    return LanguageLevel[levelNum] ? `${LanguageLevel[levelNum]}` : 'Custom Level';
  }

  public resetGame(): void {
    this.lives.set(3);
    this.currentVerbIndex.set(0);
    this.isLevelFinished.set(false);
    this.isGameOver.set(false);
    this.verbsList = shuffleArray(this.verbsList);
    this.startNewQuiz();
  }

  public startNewQuiz(): void {
    // переключаем состояние на Экран Победы
    if (this.currentVerbIndex() >= this.verbsList.length) {
      this.isLevelFinished.set(true);
      // 26 08 В момент, когда квиз успешно завершен:
      // Сервис проверяет: если пройден текущий максимальный уровень, откроется следующий!
      this.progressService.unlockNextLevel(this.selectedLevel());
      return;
    }

    const activeVerb = this.verbsList[this.currentVerbIndex()];
    this.currentVerb.set(activeVerb);

    this.selectedAnswer.set(null);
    this.isAnswerChecked.set(false);

    const randomForm = Math.random() > 0.5 ? 2 : 3;
    this.testingFormNumber.set(randomForm);

    // let correctAnswer = '';
    const correctAnswer = this.getCorrectAnswerString();
    const distractors = randomForm === 2
      ? activeVerb.form2Distractors
      : activeVerb.form3Distractors;

    const allOptions = [correctAnswer, ...distractors.slice(0, 4)];
    this.quizOptions.set(shuffleArray(allOptions));
  }

  public onSelectOption(option: string): void {
    this.selectedAnswer.set(option);
  }

  // отмена выбора
  public onClearAnswer(): void {
    if (this.isAnswerChecked()) return; 
    this.selectedAnswer.set(null);      
  }

  public onCheckAnswer(): void {
    const activeVerb = this.currentVerb();
    const userAnswer = this.selectedAnswer();

    if (!activeVerb || !userAnswer) return;

    // const correctAnswer = this.testingFormNumber() === 2 ? activeVerb.form2 : activeVerb.form3;
    const correctAnswer = this.getCorrectAnswerString();
    const isCorrect = userAnswer === correctAnswer;

    this.isCurrentAnswerCorrect.set(isCorrect);
    this.isAnswerChecked.set(true);

    if (!isCorrect) {
      this.lives.update(l => l - 1);
    }
  }

  public onNextQuestion(): void {
    // переключаем состояние на экран Game Over
    if (this.lives() <= 0) {
      this.isGameOver.set(true);
      return;
    }

    // if (this.isCurrentAnswerCorrect()) {
    this.currentVerbIndex.update(i => i + 1);
    // }

    this.startNewQuiz();
  }

  public getCorrectAnswerString(): string {
    const activeVerb = this.currentVerb();
    if (!activeVerb) return '';
    return this.testingFormNumber() === 2 ? activeVerb.form2 : activeVerb.form3;
  }

  goToMenu(): void {
    this.router.navigate(['/']); // Маршрут '/' ведет на LevelsComponent
  }

  startGame(verbs: IVerb[]): void {
    // Фиксируем пришедший массив глаголов для текущего уровня
    this.verbsList = shuffleArray(verbs); // Сразу перемешиваем при старте!
    this.totalVerbs.set(this.verbsList.length);
    // Сбрасываем состояние экрана и жизни для новой игры
    this.isLevelFinished.set(false);
    this.lives.set(3);
    this.currentVerbIndex.set(0); // Начинаем с самого первого глагола
    //Запускаем первый квиз
    this.startNewQuiz();
  }

  // в след версиях -- убрать дублирование кода в этих двух методах
  goToNextLevel(): void {
    const nextLevel = this.selectedLevel() + 1;

    this.router.navigate(['/trainer', this.selectedLanguage(), nextLevel]).then(() => {
      const currentLang = this.selectedLanguage();
      this.selectedLevel.set(nextLevel);

      this.verbService.getVerbs(currentLang, nextLevel)
        .pipe(take(1))
        .subscribe({
          next: (verbs) => {
            // Передаем новые глаголы в метод старта игры
            this.startGame(verbs);
          },
          error: (err) => console.error('Ошибка бесшовного перехода:', err)
        });
    });
  }

  private loadCurrentLevelData(): void {
    // 26 08 Автоматически вытаскиваем язык и уровень из адресной строки/роутера
    const lang = this.route.snapshot.paramMap.get('lang') || 'en';
    const levelNum = Number(this.route.snapshot.paramMap.get('level')) || 1;

    this.selectedLanguage.set(lang);
    this.selectedLevel.set(levelNum);

    // Загружаем глаголы с живого бэкенда конкретно под этот язык и уровень!
    this.verbService.getVerbs(lang, levelNum)
      .pipe(take(1))
      .subscribe({
        next: (verbs) => {
          this.startGame(verbs);
        },
        error: (err) => console.error('Ошибка загрузки глаголов:', err)
      });
  }
}