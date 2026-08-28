import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { IVerb } from '../models/verb.model'; // импорт модели

@Injectable({
  providedIn: 'root' // singletone декоратор, одна версия сервиса на все приложение,чтобы данные кеша не стерлись между экранами 
})

// текущий кэш реализован через связку Map (хранилище) и оператора shareReplay(1)
export class VerbService {
  private apiUrl = 'https://localhost:7086/api/verbs';
  
  private cache = new Map<string, Observable<IVerb[]>>();

  constructor(private http: HttpClient) {}

  // метод принимает в параметры код языка и уровень сложности, возвращает список глаголов
  getVerbs(langCode: string, level: number): Observable<IVerb[]> {
    // создается строка-ключ для кэша, напр en_2
    const cacheKey = `${langCode}_${level}`;

    // проверка, есть ли этот язык и уровень в карте кэша. 
    if (this.cache.has(cacheKey)) {
      // если да, то он используется без обращения к серверу
      // "!"
      return this.cache.get(cacheKey)!;
    }

    // query-параметры в соответствии с бэкендом 
    // для адресной строки, выглядит примерно так .../api/verbs?langCode=en&level=2
    const params = new HttpParams()
      .set('langCode', langCode)
      .set('level', level.toString());

    // Делаем запрос и применяем shareReplay, чтобы сохранить результат в RxJS 
    const request$ = this.http.get<IVerb[]>(this.apiUrl, { params }).pipe(
      // shareReplay кэширует скачанный с бекенда уровень с глаголами в map
      shareReplay(1)
    );

    // Сохраняем поток из shareReplay в кэш-карту
    this.cache.set(cacheKey, request$);
    return request$;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

