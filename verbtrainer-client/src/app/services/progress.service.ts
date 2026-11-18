import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  // Храним максимальный открытый уровень пользователя (по умолчанию 1)
  private maxUnlockedLevelSignal = signal<number>(1);

  // Публичный сигнал, на который будут подписываться компоненты меню
  readonly maxUnlockedLevel = computed(() => this.maxUnlockedLevelSignal());

  constructor() {
    // В будущем здесь будет чтение из Capacitor: Preferences.get({ key: 'user_level' })
  }

  /**
   * Проверяет, разблокирован ли конкретный уровень
   */
  isLevelAvailable(level: number): boolean {
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