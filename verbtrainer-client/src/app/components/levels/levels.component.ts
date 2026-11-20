import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProgressService } from '../../services/progress.service';
import { LanguageLevel } from '../../models/language-level.enum';

@Component({
  selector: 'app-levels',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './levels.component.html',
  styleUrls: ['./levels.component.css']
})
export class LevelsComponent {
  private progressService = inject(ProgressService);
  private router = inject(Router);

  // 20.11 получаем все доступные уровни из progressService
  protected levels = this.progressService.getLevelsForMenu();

  // Проверяем доступность уровня через сервис
  protected isLocked(levelId: number): boolean {
    return !this.progressService.isLevelUnlockedInMenu(levelId);
  }

  protected selectLevel(levelId: number): void {
    if (!this.isLocked(levelId)) {
      // Пока хардкод 'en'
      this.router.navigate(['/trainer', 'en', levelId]);
    }
  }
}