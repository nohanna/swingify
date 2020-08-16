import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { SpotifyPlaylist, SpotifyPaging } from 'src/app/spotify/models/spotify.models';
import { PlaylistAction, ETrackAction } from '../../models/shared.models';

@Component({
  selector: 'exp-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.scss']
})
export class PlaylistComponent {

  @Input() playlists$: Observable<SpotifyPaging<SpotifyPlaylist>>;
  @Input() playlist$: Observable<SpotifyPlaylist>;
  @Input() isSecondary?: boolean;
  @Output() action: EventEmitter<PlaylistAction> = new EventEmitter<PlaylistAction>();

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  toDuration(durationInMs: number): string {
    const minutes: number = Math.floor(durationInMs / 60000);
    const seconds: string = ((durationInMs % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds, 10) < 10 ? '0' : ''}${seconds}`;
  }

  navigate(playlistId: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { secondary: playlistId } });
  }

  emit(track: string): void {
    const action: any = {
      trackUri: track,
      action: this.isSecondary ? ETrackAction.REMOVE : ETrackAction.ADD
    };
    this.action.emit(action);
  }

}
