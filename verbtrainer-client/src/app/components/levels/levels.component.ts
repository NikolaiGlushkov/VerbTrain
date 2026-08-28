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

  public levels = [
    { id: 1, name: 'A1 (Beginner)', value: LanguageLevel.A1 },
    { id: 2, name: 'A2 (Elementary)', value: LanguageLevel.A2 },
    { id: 3, name: 'B1 (Intermediate)', value: LanguageLevel.B1 },
    // { id: 4, name: 'B2 (Upper-Intermediate)', value: LanguageLevel.B2 }
  ];

  // Проверяем доступность уровня через сервис
  isLocked(levelId: number): boolean {
    return !this.progressService.isLevelAvailable(levelId);
  }

  selectLevel(levelId: number): void {
    if (!this.isLocked(levelId)) {
      // Пока хардкод 'en'
      this.router.navigate(['/trainer', 'en', levelId]);
    }
  }
}