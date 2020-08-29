import { Injectable, OnDestroy, Inject, LOCALE_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject, Subscription } from 'rxjs';
import { shareReplay, catchError } from 'rxjs/operators';

import { environment } from 'src/environments/environment';

import { SpotifyUser, SpotifyPlaylist, SpotifyPaging, PlaylistCreation, PlaylistTrack, SpotifyFeaturedPlaylists } from '../models/spotify.models';
import { ErrorService } from 'src/app/shared/services/error.service';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService implements OnDestroy {

  private primaryUser: Subject<SpotifyUser> = new Subject<SpotifyUser>();
  private primaryPlaylists: Subject<SpotifyPaging<SpotifyPlaylist>> = new Subject<SpotifyPaging<SpotifyPlaylist>>();
  primaryUser$: Observable<SpotifyUser> = this.primaryUser.asObservable().pipe(shareReplay());
  primaryPlaylists$: Observable<SpotifyPaging<SpotifyPlaylist>> = this.primaryPlaylists.asObservable().pipe(shareReplay());

  private secondaryUser: Subject<SpotifyUser> = new Subject<SpotifyUser>();
  private secondaryPlaylists: Subject<SpotifyPaging<SpotifyPlaylist>> = new Subject<SpotifyPaging<SpotifyPlaylist>>();
  secondaryUser$: Observable<SpotifyUser> = this.secondaryUser.asObservable().pipe(shareReplay());
  secondaryPlaylists$: Observable<SpotifyPaging<SpotifyPlaylist>> = this.secondaryPlaylists.asObservable().pipe(shareReplay());

  private subscriptions: Subscription[] = [];

  constructor(
    private http: HttpClient,
    private errorService: ErrorService,
    @Inject(LOCALE_ID) public locale: string
  ) {
    this.subscriptions.push(
      this.updateUser(false),
      this.updatePlaylists(false)
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  getUser(isSecondary: boolean): Observable<SpotifyUser> {
    return this.http.get<SpotifyUser>(
      `${environment.spotify.serverPath}/me`,
      { headers: this.setSecondaryHeader(isSecondary) }
    ).pipe(catchError(err => this.errorService.handleError(err)));
  }

  getPlaylists(isSecondary: boolean): Observable<SpotifyPaging<SpotifyPlaylist>> {
    return this.http.get<SpotifyPaging<SpotifyPlaylist>>(
      `${environment.spotify.serverPath}/playlists`,
      { headers: this.setSecondaryHeader(isSecondary) }
    ).pipe(catchError(err => this.errorService.handleError(err)));
  }

  updateUser(isSecondary: boolean): Subscription {
    return this.getUser(isSecondary)
      .subscribe(user => isSecondary ? this.secondaryUser.next(user) : this.primaryUser.next(user));
  }

  updatePlaylists(isSecondary: boolean): Subscription {
    return this.getPlaylists(isSecondary)
      .subscribe(playlists => isSecondary ? this.secondaryPlaylists.next(playlists) : this.primaryPlaylists.next(playlists));
  }

  getPlaylist(id: string, isSecondary: boolean): Observable<SpotifyPlaylist> {
    return this.http.get<SpotifyPlaylist>(
      `${environment.spotify.serverPath}/playlists/${id}`,
      { headers: this.setSecondaryHeader(isSecondary) }
    ).pipe(catchError(err => this.errorService.handleError(err)));
  }

  getPlaylistTracks(id: string, isSecondary: boolean, next?: string, query?: string): Observable<SpotifyPaging<PlaylistTrack>> {
    return this.http.get<SpotifyPaging<PlaylistTrack>>(
      `${environment.spotify.serverPath}/playlists/${id}/tracks`,
      { params: this.createParams(next, query), headers: this.setSecondaryHeader(isSecondary) }
    ).pipe(catchError(err => this.errorService.handleError(err)));
  }

  private createParams(next?: string, query?: string): HttpParams {
    let params: HttpParams = new HttpParams();
    if (next) {
      params = params.append('next', btoa(next));
    }
    if (query) {
      params = params.append('search', query);
    }
    return params;
  }

  createPlaylist(userId: string, playlist: PlaylistCreation, isSecondary: boolean): Observable<SpotifyPlaylist> {
    return this.http.post<SpotifyPlaylist>(
      `${environment.spotify.serverPath}/users/${userId}/playlists`, playlist,
      { headers: this.setSecondaryHeader(isSecondary) }
    ).pipe(catchError(err => this.errorService.handleError(err)));
  }

  addTracks(id: string, track: string, from?: string): Observable<never> {
    return this.http.post<never>(
      `${environment.spotify.serverPath}/playlists/${id}`, track,
      { params: from ? new HttpParams().set('from', from) : null, headers: this.setSecondaryHeader(true) }
    ).pipe(catchError(err => this.errorService.handleError(err)));
  }

  removeTracks(id: string, tracks: string, from?: string): Observable<ArrayBuffer> {
    return this.http.request<ArrayBuffer>('delete',
      `${environment.spotify.serverPath}/playlists/${id}`,
      {
        body: tracks,
        params: from ? new HttpParams().set('from', from) : null,
        headers: this.setSecondaryHeader(true)
      }
    ).pipe(catchError(err => this.errorService.handleError(err)));
  }

  getFeaturedPlaylists(): Observable<SpotifyFeaturedPlaylists> {
    return this.http.get<SpotifyFeaturedPlaylists>(
      `${environment.spotify.serverPath}/featured`,
      { params: new HttpParams().set('locale', this.locale), headers: this.setSecondaryHeader(false) }
    ).pipe(
      shareReplay(),
      catchError(err => this.errorService.handleError(err))
    );
  }

  private setSecondaryHeader(isSecondary: boolean): HttpHeaders {
    return new HttpHeaders({ Secondary: isSecondary.toString() });
  }

}
