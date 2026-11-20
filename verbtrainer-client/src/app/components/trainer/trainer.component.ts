import { Component, OnInit, signal, inject } from '@angular/core';
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
  templateUrl: './trainer.component.html',
  styleUrl: './trainer.component.css'
})
export class TrainerComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private progressService = inject(ProgressService);
  private verbService = inject(VerbService);

  // Состояния промежуточных экранов 
  protected isLevelFinished = signal<boolean>(false);
  protected isGameOver = signal<boolean>(false);
  protected isFinalVictory = signal<boolean>(false);

  // игровые данные
  private verbsList: IVerb[] = [];
  protected currentVerb = signal<IVerb | null>(null);
  protected currentVerbIndex = signal<number>(0);
  protected lives = signal<number>(3);

  protected testingFormNumber = signal<2 | 3>(2);
  protected quizOptions = signal<string[]>([]);
  protected selectedAnswer = signal<string | null>(null);
  protected isAnswerChecked = signal<boolean>(false);
  protected isCurrentAnswerCorrect = signal<boolean>(false);

  private selectedLevel = signal<number>(1); 
  protected totalVerbs = signal<number>(0);  

  private interfaceLanguage: string = ''; 
  private studiedLanguage = signal<string>(''); 

  ngOnInit(): void {
    this.initInterfaceLanguage();

    // вытаскиваем язык и уровень из адресной строки/роутера
    const lang = this.route.snapshot.paramMap.get('lang') || 'en';
    const level = Number(this.route.snapshot.paramMap.get('level')) || 1;

    this.studiedLanguage.set(lang);
    this.initializeLevel(level);
  }

  // LocalizationService Автоопределение языка телефона для интерфейса доделать.
  private initInterfaceLanguage(): void {
    const deviceLang = navigator.language.split('-')[0];
    // Если язык поддерживается — ставим его, иначе дефолтный русский
    // this.currentLanguageCode = TRANSLATIONS[deviceLang] ? deviceLang : 'ru';
    this.interfaceLanguage = 'ru';
  }

  // Функция-переводчик для HTML шаблона
  // в след версиях перенести в сервис локализации
  protected t(key: string): string {
    return TRANSLATIONS[this.interfaceLanguage]?.[key] || key;
  }

  // Динамическое получение имени уровня из Enum 
  protected getLevelName(): string {
    const levelNum = this.selectedLevel();
    return LanguageLevel[levelNum] ? `${LanguageLevel[levelNum]}` : 'Custom Level';
  }

  protected restartLevel(): void {
    this.resetLevel();
    this.verbsList = shuffleArray(this.verbsList);
    this.startNewQuiz();
  }

  private startLevel(verbs: IVerb[]): void {
    // Фиксируем пришедший массив глаголов для текущего уровня
    this.verbsList = shuffleArray(verbs); // Сразу перемешиваем при старте!
    this.totalVerbs.set(this.verbsList.length);
    this.resetLevel();
    this.startNewQuiz();
  }

  private resetLevel(): void {
    this.currentVerbIndex.set(0);
    this.isLevelFinished.set(false);
    this.lives.set(3);
    // 19 11
    this.isFinalVictory.set(false);
    this.isGameOver.set(false);
  }

  private startNewQuiz(): void {
    const activeVerb = this.verbsList[this.currentVerbIndex()];
    this.currentVerb.set(activeVerb);

    this.selectedAnswer.set(null);
    this.isAnswerChecked.set(false);

    const randomForm = Math.random() > 0.5 ? 2 : 3;
    this.testingFormNumber.set(randomForm);

    const correctAnswer = this.getCorrectAnswer();
    const distractors = randomForm === 2 ? activeVerb.form2Distractors : activeVerb.form3Distractors;

    // дистракторов может быть больше больше 4 в джейсоне, но будут взяты только одни и те же первые 4! 
    // но можно сделать shuffle и тогда будет больше вариативности
    const allOptions = [correctAnswer, ...distractors.slice(0, 4)];
    this.quizOptions.set(shuffleArray(allOptions));
  }

  // 23.10 метод кнопки "дальше" всплывающей панели
  protected onNextQuiz(): void {
    // экран Game Over если жизней не осталось
    if (this.lives() <= 0) {
      this.isGameOver.set(true);
      return;
    }
    this.currentVerbIndex.update(i => i + 1);

    // 20 11 скопировал этот if из startNewQuiz
    if (this.currentVerbIndex() >= this.verbsList.length) {
      if (this.selectedLevel() === this.progressService.lastLevel) {
        this.isFinalVictory.set(true);
      } else {
        this.isLevelFinished.set(true);
        this.progressService.unlockNextLevel(this.selectedLevel());
      }
      return;
    }
    this.startNewQuiz();
  }

  protected onSelectOption(option: string): void {
    this.selectedAnswer.set(option);
  }

  // отмена выбора
  protected onClearAnswer(): void {
    if (this.isAnswerChecked()) return;
    this.selectedAnswer.set(null);
  }

  protected onCheckAnswer(): void {
    const activeVerb = this.currentVerb();
    const userAnswer = this.selectedAnswer();

    if (!activeVerb || !userAnswer) return;

    const correctAnswer = this.getCorrectAnswer();
    const isCorrect = userAnswer === correctAnswer;

    this.isCurrentAnswerCorrect.set(isCorrect);
    this.isAnswerChecked.set(true);

    if (!isCorrect) {
      this.lives.update(l => l - 1);
    }
  }

  protected getCorrectAnswer(): string {
    const activeVerb = this.currentVerb();
    if (!activeVerb) return '';
    return this.testingFormNumber() === 2 ? activeVerb.form2 : activeVerb.form3;
  }

  protected goToMenu(): void {
    this.router.navigate(['/']); // Маршрут '/' ведет на LevelsComponent
  }

  // 20 11 навигация кнопки "дальше"
  protected goToNextLevel(): void {
    const nextLevel = this.selectedLevel() + 1;

    this.router.navigate(['/trainer', this.studiedLanguage(), nextLevel]).then(() => {
      this.initializeLevel(nextLevel);
    });
  }

  private initializeLevel(level: number): void {
    this.selectedLevel.set(level);
    // Загружаем глаголы с бэкенда или ассетов
    this.verbService.getVerbs(this.studiedLanguage(), level)
      .pipe(take(1))
      .subscribe((verbs) => this.startLevel(verbs));
  }
}