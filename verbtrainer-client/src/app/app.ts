import { Component, signal } from '@angular/core';
import { TrainerComponent } from './components/trainer/trainer.component'; 
import { RouterOutlet } from '@angular/router';

// это корневой компонент
@Component({
  selector: 'app-root',
  standalone: true, 
  // imports: [TrainerComponent], 
  // template: '<app-trainer></app-trainer>', 
  imports: [RouterOutlet], 
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {
}
