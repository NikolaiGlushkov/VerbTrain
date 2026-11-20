import { Injectable, signal, computed } from '@angular/core';
import { LanguageLevel } from '../models/language-level.enum';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {

  // 19 11 Единый список уровней (перенесли из levels.component.ts и добавили hasContent)
  private readonly levelsConfig = [
    { id: 1, name: 'A1 (Beginner)', value: LanguageLevel.A1, hasContent: true },
    { id: 2, name: 'A2 (Elementary)', value: LanguageLevel.A2, hasContent: true },
    { id: 3, name: 'B1 (Intermediate)', value: LanguageLevel.B1, hasContent: false },
    { id: 4, name: 'B2 (Upper-Intermediate)', value: LanguageLevel.B2, hasContent: false },
    { id: 5, name: 'C1 (Advanced)', value: LanguageLevel.C1, hasContent: false },
    { id: 6, name: 'C2 (Proficiency)', value: LanguageLevel.C2, hasContent: false },
    { id: 7, name: 'Special', value: LanguageLevel.Special, hasContent: false },
  ];

  // 19 11 Последний доступный уровень с контентом
  public get lastLevel(): LanguageLevel | undefined {
    const allLevelsWithContent = this.getLevelsForMenu();
    return allLevelsWithContent[allLevelsWithContent.length - 1]?.value;
  }

  // 19 11 2 сущности ниже--аналоги полного свойства в c#
  // Храним максимальный открытый уровень пользователя в меню (по умолчанию 1)
  private maxUnlockedLevelSignal = signal<number>(1);
  // Публичный сигнал, на который будут подписываться компоненты меню
  readonly maxUnlockedLevel = computed(() => this.maxUnlockedLevelSignal());

  constructor() {
    // В будущем здесь будет чтение из Capacitor: Preferences.get({ key: 'user_level' })
    // 19 11 При капаситор можно использовать отделньый метод initProgress(), 
    //  либо вызвать capacitorpreferences здесь, если потребуется асинхронный старт
  }

  // 19 11 Возвращает активные уровни для главного меню
  public getLevelsForMenu() {
    return this.levelsConfig.filter((item) => item.hasContent);
  }

  /**
   * Проверяет, разблокирован ли конкретный уровень в меню
   */
  isLevelUnlockedInMenu(level: number): boolean {
    return level <= this.maxUnlockedLevelSignal();
  }

  /**
   * Разблокирует следующий уровень в меню, если текущий успешно пройден
   */
  unlockNextLevel(currentLevel: number): void {
    const nextLevel = currentLevel + 1;
    // 18.11 эта проверка нужна, чтобы пользователь мог перепройти уже открытый уровень
    if (currentLevel === this.maxUnlockedLevelSignal()) {
      this.maxUnlockedLevelSignal.set(nextLevel);
      // В будущем здесь будет запись в Capacitor: Preferences.set({ key: 'user_level', value: ... })
      // И отправка пакета (Batching) на бэкенд Minimal API
    }
  }
}