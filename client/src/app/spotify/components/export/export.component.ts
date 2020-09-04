import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subscription, Subject, EMPTY } from 'rxjs';
import { flatMap, shareReplay, tap, scan } from 'rxjs/operators';

import { ToastrService } from 'ngx-toastr';

import { SpotifyService } from '../../services/spotify.service';
import { AuthService } from 'src/app/shared/services/auth.service';

import { SpotifyPlaylist, SpotifyUser, SpotifyPaging, PlaylistTrack } from '../../models/spotify.models';
import { PlaylistAction, ETrackAction } from 'src/app/shared/models/shared.models';

@Component({
  selector: 'swg-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss']
})
export class ExportComponent implements OnInit, OnDestroy {

  primaryPlaylist: Subject<SpotifyPlaylist> = new Subject<SpotifyPlaylist>();
  primaryPlaylist$: Observable<SpotifyPlaylist> = this.primaryPlaylist.asObservable().pipe(shareReplay());
  primaryPlaylistTracks: Subject<SpotifyPaging<PlaylistTrack>> = new Subject<SpotifyPaging<PlaylistTrack>>();
  primaryPlaylistTracks$: Observable<SpotifyPaging<PlaylistTrack>> = this.primaryPlaylistTracks.asObservable().pipe(
    scan((prev: SpotifyPaging<PlaylistTrack>, next: SpotifyPaging<PlaylistTrack>) => this.handleEmittedTracks(prev, next)),
    shareReplay()
  );

  secondaryPlaylist: Subject<SpotifyPlaylist> = new Subject<SpotifyPlaylist>();
  secondaryPlaylist$: Observable<SpotifyPlaylist> = this.secondaryPlaylist.asObservable().pipe(shareReplay());
  secondaryPlaylistTracks: Subject<SpotifyPaging<PlaylistTrack>> = new Subject<SpotifyPaging<PlaylistTrack>>();
  secondaryPlaylistTracks$: Observable<SpotifyPaging<PlaylistTrack>> = this.secondaryPlaylistTracks.asObservable().pipe(
    scan((prev: SpotifyPaging<PlaylistTrack>, next: SpotifyPaging<PlaylistTrack>) => this.handleEmittedTracks(prev, next)),
    shareReplay()
  );

  private primaryId: string;
  private secondaryId: string;
  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private spotifyService: SpotifyService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.subscriptions.push(this.initPrimaryPlaylist());
    if (this.isSecondaryAuthenticated()) {
      this.subscriptions.push(
        this.spotifyService.updateUser(true),
        this.spotifyService.updatePlaylists(true),
        this.initSecondaryPlaylist()
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  get primaryUser$(): Observable<SpotifyUser> {
    return this.spotifyService.primaryUser$;
  }

  get primaryPlaylists$(): Observable<SpotifyPaging<SpotifyPlaylist>> {
    return this.spotifyService.primaryPlaylists$;
  }

  get secondaryUser$(): Observable<SpotifyUser> {
    return this.spotifyService.secondaryUser$;
  }

  get secondaryPlaylists$(): Observable<SpotifyPaging<SpotifyPlaylist>> {
    return this.spotifyService.secondaryPlaylists$;
  }

  private initPrimaryPlaylist(): Subscription {
    return this.route.queryParams.pipe(
      tap(params => this.primaryId = params.p),
      flatMap(params => params.p ? this.getPrimaryPlaylist(params.p) : EMPTY)
    ).subscribe();
  }

  private getPrimaryPlaylist(id: string, fromNext?: boolean): Observable<SpotifyPaging<PlaylistTrack>> {
    return this.spotifyService.getPlaylist(id, false).pipe(
      tap(playlist => this.updatePrimaryPlaylist(playlist)),
      flatMap(playlist => this.getPrimaryPlaylistTracks(playlist.id, fromNext))
    );
  }

  private getPrimaryPlaylistTracks(
    id: string,
    fromNext?: boolean,
    toNext?: string,
    query?: string
  ): Observable<SpotifyPaging<PlaylistTrack>> {
    return this.spotifyService.getPlaylistTracks(id, false, toNext, query).pipe(
      tap(tracks => tracks.parentId = id),
      tap(tracks => tracks.fromNext = fromNext),
      tap(tracks => this.updatePrimaryPlaylistTracks(tracks))
    );
  }

  private updatePrimaryPlaylist(playlist: SpotifyPlaylist): void {
    this.primaryPlaylist.next(playlist);
  }

  private updatePrimaryPlaylistTracks(tracks: SpotifyPaging<PlaylistTrack>): void {
    this.primaryPlaylistTracks.next(tracks);
  }

  private initSecondaryPlaylist(): Subscription {
    return this.route.queryParams.pipe(
      tap(params => this.secondaryId = params.s),
      flatMap(params => params.s ? this.getSecondaryPlaylist(params.s) : EMPTY)
    ).subscribe();
  }

  private getSecondaryPlaylist(id: string, fromNext?: boolean): Observable<SpotifyPaging<PlaylistTrack>> {
    return this.spotifyService.getPlaylist(id, true).pipe(
      tap(playlist => this.updateSecondaryPlaylist(playlist)),
      flatMap(playlist => playlist ? this.getSecondaryPlaylistTracks(playlist.id, fromNext) : EMPTY)
    );
  }

  private getSecondaryPlaylistTracks(
    id: string,
    fromNext?: boolean,
    toNext?: string,
    query?: string
  ): Observable<SpotifyPaging<PlaylistTrack>> {
    return this.spotifyService.getPlaylistTracks(id, true, toNext, query).pipe(
      tap(tracks => tracks.parentId = id),
      tap(tracks => tracks.fromNext = fromNext),
      tap(tracks => this.updateSecondaryPlaylistTracks(tracks))
    );
  }

  private updateSecondaryPlaylist(playlist: SpotifyPlaylist): void {
    this.secondaryPlaylist.next(playlist);
  }

  private updateSecondaryPlaylistTracks(tracks: SpotifyPaging<PlaylistTrack>): void {
    this.secondaryPlaylistTracks.next(tracks);
  }

  private handleEmittedTracks(
    prev: SpotifyPaging<PlaylistTrack>,
    next: SpotifyPaging<PlaylistTrack>
  ): SpotifyPaging<PlaylistTrack> {
    return prev.parentId === next.parentId && next.items.length > 0 && next.fromNext
      ? { ...next, items: [...prev.items, ...next.items] } : next;
  }

  isLargeScreen(): boolean {
    return window.screen.width > 1750;
  }

  isSecondaryAuthenticated(): boolean {
    return AuthService.isSecondaryAuthenticated();
  }

  authenticate(): void {
    this.authService.authorize().subscribe();
  }

  navigateBack(isSecondary?: boolean): void {
    if (isSecondary) {
      this.router.navigate(['/spotify/export'], { queryParams: { p: this.primaryId } });
      this.updateSecondaryPlaylist(null);
    } else {
      this.router.navigate(['/spotify/export'], { queryParams: { s: this.secondaryId } });
      this.updatePrimaryPlaylist(null);
    }
  }

  execute(action: PlaylistAction): void {
    this.subscriptions.push(this.performOnTracks(action).pipe(
      flatMap(() => this.getSecondaryPlaylist(this.secondaryId))
    ).subscribe(() => this.onSuccess(action)));
  }

  performOnTracks(action: PlaylistAction): Observable<ArrayBuffer | never> {
    switch (action.action) {
      case ETrackAction.ADD:
        return action.complete
          ? this.spotifyService.addTracks(this.secondaryId, action.trackUri, this.primaryId)
          : this.spotifyService.addTracks(this.secondaryId, action.trackUri);
      case ETrackAction.REMOVE:
        return action.complete
          ? this.spotifyService.removeTracks(this.secondaryId, action.trackUri, this.secondaryId)
          : this.spotifyService.removeTracks(this.secondaryId, action.trackUri);
      default:
        break;
    }
  }

  private onSuccess(action: PlaylistAction): void {
    switch (action.action) {
      case ETrackAction.ADD:
        action.complete
          ? this.toastr.success('Tracks were successfully added!', null, { progressBar: true, timeOut: 2000 })
          : this.toastr.success('Track was successfully added!', null, { progressBar: true, timeOut: 2000 });
        break;
      case ETrackAction.REMOVE:
        action.complete
          ? this.toastr.success('Tracks were successfully removed!', null, { progressBar: true, timeOut: 2000 })
          : this.toastr.success('Track was successfully removed!', null, { progressBar: true, timeOut: 2000 });
        break;
      default:
        break;
    }
  }

  onNext(next: string, isSecondary: boolean): void {
    isSecondary
      ? this.subscriptions.push(this.getSecondaryPlaylistTracks(this.secondaryId, true, next).subscribe())
      : this.subscriptions.push(this.getPrimaryPlaylistTracks(this.primaryId, true, next).subscribe());
  }

  onSearch(query: string, isSecondary: boolean): void {
    isSecondary
      ? this.subscriptions.push(this.getSecondaryPlaylistTracks(this.secondaryId, false, null, query).subscribe())
      : this.subscriptions.push(this.getPrimaryPlaylistTracks(this.primaryId, false, null, query).subscribe());
  }

}
