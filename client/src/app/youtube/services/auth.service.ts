import { Injectable, Inject, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, EMPTY } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { AuthorizationToken } from '../../shared/models/shared.models';
import { ErrorService } from '../../shared/services/error.service';

@Injectable()
export class AuthService {

  constructor(
    private http: HttpClient,
    private errorService: ErrorService,
    private router: Router,
    private sanitizer: DomSanitizer,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  static setToken(token: AuthorizationToken): void {
    localStorage.setItem('primary_youtube_token', JSON.stringify(token));
  }

  static getToken(): AuthorizationToken {
    return JSON.parse(localStorage.getItem('primary_youtube_token'));
  }

  static removeToken(): void {
    localStorage.removeItem('primary_youtube_token');
  }

  static isTokenExpired(token: AuthorizationToken): boolean {
    const expirationDate: number = token.created_at + token.expires_in;
    const current: number = Date.now() / 1000;
    return current > expirationDate;
  }

  static isAuthenticated(): boolean {
    const token = AuthService.getToken();
    return token && !AuthService.isTokenExpired(token);
  }

  verify(authorizationCode: string): Observable<AuthorizationToken> {
    return this.http.get<AuthorizationToken>(
      `${environment.youtube.userPath}/verify`,
      { params: new HttpParams().set('authorizationCode', authorizationCode) }
    ).pipe(
      catchError(() => {
        this.router.navigateByUrl('/login');
        return EMPTY;
      })
    );
  }

  authorize(): Observable<never> {
    return this.http.get<string>(`${environment.youtube.userPath}/authorize`, { responseType: 'text' as 'json' })
      .pipe(
        mergeMap(redirection => {
          this.document.location.href = this.sanitizer.sanitize(SecurityContext.URL, redirection);
          return EMPTY;
        }),
        catchError(err => this.errorService.handleError(err))
      );
  }

}