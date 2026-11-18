import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { IVerb } from '../models/verb.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class VerbService {
  private http = inject(HttpClient);
  
  private apiUrl = environment.apiUrl;

  // Кэшируем весь файл целиком, чтобы не читать его с диска смартфона при каждом клике
  private verbsData$: Observable<IVerb[]> | null = null;

  // метод принимает в параметры код языка и уровень сложности, возвращает список глаголов
  getVerbs(langCode: string, level: number): Observable<IVerb[]> {
    if (!this.verbsData$) {

      this.verbsData$ = this.http.get<IVerb[]>(this.apiUrl).pipe(
        shareReplay(1)
      );
    }

    // Берем поток всех глаголов и фильтруем массив под нужный уровень
    return this.verbsData$.pipe(
      map(verbs => {
        // Фильтруем глаголы, у которых свойство Level  совпадает с запрашиваемым
        // 22.10 ВАЖНОЕ ДОПОЛНЕНИЕ: от verbs.filter можно будет избавиться, если джейсон будет разбит на несколько по языковым уровням
        return verbs.filter(verb => verb.languageLevel === level);
      })
    );
  }

  clearCache(): void {
    this.verbsData$ = null;
  }
}

