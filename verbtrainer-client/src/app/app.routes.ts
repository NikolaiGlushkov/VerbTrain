import { Routes } from '@angular/router';
import { LevelsComponent } from './components/levels/levels.component';
import { TrainerComponent } from './components/trainer/trainer.component'; // Путь к вашему тренеру

export const routes: Routes = [
  { path: '', component: LevelsComponent }, // Стартуем сразу с меню уровней
  { path: 'trainer/:lang/:level', component: TrainerComponent }, // тренажер
  { path: '**', redirectTo: '' } // Защита от перехода на несуществующие страницы
];
