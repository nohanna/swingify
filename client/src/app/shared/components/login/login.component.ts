import { Component, OnDestroy, Inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

import { environment } from 'src/environments/environment';
import { SpotifyService } from 'src/app/spotify/services/spotify.service';
import { AuthorizationToken, AuthorizeQueryOptions } from 'src/app/spotify/models/spotify.models';

@Component({
  selector: 'exp-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {

  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private router: Router,
    private spotifyService: SpotifyService
  ) { }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  redirect(): void {
    const token: AuthorizationToken = SpotifyService.getToken();
    if (token) {
      SpotifyService.isTokenExpired ? this.refresh(token) : this.router.navigateByUrl('/spotify/home');
    } else {
      this.authorize();
    }
  }

  private authorize(): void {
    this.subscriptions.push(
      this.spotifyService.getSpotifyConfiguration().subscribe(config => {
        const options: AuthorizeQueryOptions = {
          responseType: 'code',
          clientId: config.clientId,
          redirectUri: 'http%3A%2F%2Flocalhost%3A4200%2Fprocess'
        };
        this.document.location.href = `${environment.spotify.accountsPath}/authorize?client_id=${options.clientId}` +
          `&response_type=${options.responseType}&redirect_uri=${options.redirectUri}`;
      })
    );
  }

  private refresh(token: AuthorizationToken): void {
    this.subscriptions.push(
      this.spotifyService.verify(token.refresh_token)
        .subscribe(refreshedToken => {
          token.created_at = Date.now() / 1000; // in seconds
          SpotifyService.setToken(refreshedToken);
        }, () => this.authorize())
    );
  }

}
