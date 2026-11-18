import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerbService } from '../../services/verb.service';
import { IVerb } from '../../models/verb.model';
import { LanguageLevel } from '../../models/language-level.enum';
import { shuffleArray } from '../../helpers/shuffle.helper';
import { take } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressService } from '../../services/progress.service';

// локализация пойдет в LocalizationService
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
  // 06.10 verbService был в конструкторе
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private progressService = inject(ProgressService);
  private verbService = inject(VerbService);

  // Состояния промежуточных экранов 
  isLevelFinished = signal<boolean>(false);
  isGameOver = signal<boolean>(false);
  isFinalVictory = signal<boolean>(false);

  // игровые данные
  verbsList: IVerb[] = [];
  currentVerb = signal<IVerb | null>(null);
  currentVerbIndex = signal<number>(0);
  lives = signal<number>(3);

  testingFormNumber = signal<2 | 3>(2);
  quizOptions = signal<string[]>([]);
  selectedAnswer = signal<string | null>(null);
  isAnswerChecked = signal<boolean>(false);
  isCurrentAnswerCorrect = signal<boolean>(false); 

  
  selectedLevel = signal<number>(1); // тут было languageLevel.A1
  totalVerbs = signal<number>(0);  // изначально был хардкод 26

  // 17 11 стоит объединить эту переменную и сигнал?
  // возможно, эту переменную, когда будет возможность переключать язык из меню, можно будет оформить в сигнал
  currentLanguageCode: string = ''; // был хардкод ru //
  selectedLanguage = signal<string>(''); // тут был хардкод en перед коммитом

  ngOnInit(): void {
    this.initInterfaceLanguage();
    this.initializeLevel();
  }


  //  LocalizationService Автоопределение языка телефона для интерфейса доделать.
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


  public restartLevel(): void {
    this.resetLevel();
    this.verbsList = shuffleArray(this.verbsList);
    this.isGameOver.set(false);
    this.startNewQuiz();
  }


  startLevel(verbs: IVerb[]): void {
    // Фиксируем пришедший массив глаголов для текущего уровня
    this.verbsList = shuffleArray(verbs); // Сразу перемешиваем при старте!
    this.totalVerbs.set(this.verbsList.length);
    this.resetLevel();
    //Запускаем первый квиз
    this.startNewQuiz();
  }

  private resetLevel(): void {
    this.currentVerbIndex.set(0);
    this.isLevelFinished.set(false);
    this.lives.set(3);
  }


  // 18 11 надо разгрузить этот метод
  public startNewQuiz(): void {
    if (this.currentVerbIndex() >= this.verbsList.length) {
      // переключаем состояние на Экран Победы
      this.isLevelFinished.set(true);
      //  unlockNextLevel из progressService открывает след уровень в меню
      this.progressService.unlockNextLevel(this.selectedLevel());
      return;
    }

    const activeVerb = this.verbsList[this.currentVerbIndex()];
    this.currentVerb.set(activeVerb);

    this.selectedAnswer.set(null);
    this.isAnswerChecked.set(false);

    const randomForm = Math.random() > 0.5 ? 2 : 3;
    this.testingFormNumber.set(randomForm);

    const correctAnswer = this.getCorrectAnswerString();
    // если форма равна двум то это дистрактор второй формы, а если нет , то это дистрактор третьей формы глагола
    const distractors = randomForm === 2 ? activeVerb.form2Distractors : activeVerb.form3Distractors;

    // дистракторов может быть больше больше 4 в джейсоне, но будут взяты только одни и те же первые 4! 
    // но можно сделать shuffle и тогда будет больше вариативности
    const allOptions = [correctAnswer, ...distractors.slice(0, 4)];
    this.quizOptions.set(shuffleArray(allOptions));
  }


   // 23.10 метод кнопки "дальше" всплывающей панели
  public onNextQuiz(): void {
    // экран Game Over если жизней не осталось
    if (this.lives() <= 0) {
      this.isGameOver.set(true);
      return;
    }
    this.currentVerbIndex.update(i => i + 1);
    this.startNewQuiz();
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

    const correctAnswer = this.getCorrectAnswerString();
    const isCorrect = userAnswer === correctAnswer;

    this.isCurrentAnswerCorrect.set(isCorrect);
    this.isAnswerChecked.set(true);

    if (!isCorrect) {
      this.lives.update(l => l - 1);
    }
  }

 
  public getCorrectAnswerString(): string {
    const activeVerb = this.currentVerb();
    if (!activeVerb) return '';
    return this.testingFormNumber() === 2 ? activeVerb.form2 : activeVerb.form3;
  }


  // кнопка "возврат в главное меню"
  goToMenu(): void {
    this.router.navigate(['/']); // Маршрут '/' ведет на LevelsComponent
  }


  // в след версиях -- убрать дублирование кода в этих двух методах
  // это кнопка "дальше"
  // 22.10 она не работала при offline-first, пока я не добавил второй языковой уровень в джейсон
  goToNextLevel(): void {
    const nextLevel = this.selectedLevel() + 1;
    const currentLang = this.selectedLanguage();

    this.router.navigate(['/trainer', this.selectedLanguage(), nextLevel]).then(() => {
      this.selectedLevel.set(nextLevel);
      //17.11 отсюда полное дублирование с initializeLevel
      this.verbService.getVerbs(currentLang, nextLevel)
        .pipe(take(1))
        .subscribe({
          next: (verbs) => {
            // Передаем новые глаголы в метод старта игры
            this.startLevel(verbs);
          },
          error: (err) => console.error('Ошибка бесшовного перехода:', err)
        });
    });
  }

  
  private initializeLevel(): void {
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
          this.startLevel(verbs);
        },
        error: (err) => console.error('Ошибка загрузки глаголов:', err)
      });
  }
}