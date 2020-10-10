import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

import { ToastrService } from 'ngx-toastr';

import { SpotifyPaging, SpotifyPlaylist, PlaylistCreation, SpotifyUser } from 'src/app/spotify/models/spotify.models';
import { DialogInput, Platform } from '../../../shared/models/shared.models';

import { SpotifyService } from 'src/app/spotify/services/spotify.service';
import { PrimaryService } from '../../services/primary.service';
import { SecondaryService } from '../../services/secondary.service';

@Component({
  selector: 'swg-playlists',
  templateUrl: './playlists.component.html',
  styleUrls: ['./playlists.component.scss']
})
export class PlaylistsComponent implements OnInit, OnDestroy {

  @Input() title: string;
  @Input() allowCreation?: boolean;
  @Input() user$: Observable<SpotifyUser>;
  @Input() playlists$: Observable<SpotifyPaging<SpotifyPlaylist>>;
  @Input() isSecondary: boolean;
  @Input() platform: string;

  subscriptions: Subscription[] = [];
  dialog: DialogInput;
  isCreating: boolean;

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private spotifyService: SpotifyService,
    private primaryService: PrimaryService,
    private secondaryService: SecondaryService
  ) { }

  ngOnInit(): void {
    this.dialog = {
      title: 'Create a playlist',
      label: `Playlist's name`,
      placeholder: 'New playlist',
      action: 'Create'
    };
  }

  ngOnDestroy(): void {
    if (this.subscriptions) {
      this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }
  }

  navigate(toSavedTracks: boolean, playlistId?: string): void {
    this.isSecondary ? this.secondaryNavigate(toSavedTracks, playlistId) : this.primaryNavigate(toSavedTracks, playlistId);
  }

  primaryNavigate(toSavedTracks: boolean, playlistId?: string): void {
    const tree: UrlTree = this.router.parseUrl(this.router.url);
    if (toSavedTracks) {
      this.router.navigate(['/spotify/export'], { queryParams: { p: 'liked', s: tree.queryParams.s } });
    } else {
      tree.queryParams
        ? this.router.navigate(['/spotify/export'], { queryParams: { p: playlistId, s: tree.queryParams.s } })
        : this.router.navigate(['/spotify/export'], { queryParams: { p: playlistId } });
    }
  }

  secondaryNavigate(toSavedTracks: boolean, playlistId?: string): void {
    const tree: UrlTree = this.router.parseUrl(this.router.url);
    switch (this.platform) {
      case Platform.YOUTUBE.toLowerCase():
        this.navigateAsYoutube(tree, toSavedTracks, playlistId);
        break;
      case Platform.SPOTIFY.toLowerCase():
      default:
        this.navigateAsSpotify(tree, toSavedTracks, playlistId);
        break;
    }
  }

  private navigateAsSpotify(tree: UrlTree, toSavedTracks: boolean, playlistId?: string): void {
    if (toSavedTracks) {
      this.router.navigate(['/spotify/export'], { queryParams: { p: tree.queryParams.p, s: 'liked' } });
    } else {
      tree.queryParams
        ? this.router.navigate(['/spotify/export'], { queryParams: { p: tree.queryParams.p, s: playlistId } })
        : this.router.navigate(['/spotify/export'], { queryParams: { s: playlistId } });
    }
  }

  private navigateAsYoutube(tree: UrlTree, toSavedTracks: boolean, playlistId?: string): void {
    if (toSavedTracks) {
      this.router.navigate(['/youtube/export'], { queryParams: { p: tree.queryParams.p, s: 'liked' } });
    } else {
      tree.queryParams
        ? this.router.navigate(['/youtube/export'], { queryParams: { p: tree.queryParams.p, s: playlistId } })
        : this.router.navigate(['/youtube/export'], { queryParams: { s: playlistId } });
    }
  }

  onCreate(name: string, user: string): void {
    const playlist: PlaylistCreation = { name };
    this.subscriptions.push(this.spotifyService.createPlaylist(user, playlist, this.isSecondary)
      .subscribe(() => {
        this.isSecondary
          ? this.secondaryService.updateSecondaryPlaylists()
          : this.primaryService.updatePrimaryPlaylists();
        this.isCreating = false;
        this.toastr.success('Playlist was successfully created!', null, { progressBar: true, timeOut: 2000 });
      }));
  }

}
