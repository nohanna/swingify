export interface SpotifyConfiguration {
  readonly clientId: string;
  readonly clientSecret: string;
}

export interface SpotifyUser {
  readonly country?: string;
  readonly display_name: string | null;
  readonly email?: string;
  readonly external_urls: ExternalUrl;
  readonly followers: Followers;
  readonly href: string;
  readonly id: string;
  readonly images: Image[];
  readonly product?: string;
  readonly type: string;
  readonly uri: string;
}

export interface SpotifyFeaturedPlaylists {
  readonly message: string;
  readonly playlists: SpotifyPaging<SpotifyPlaylist>;
}

export interface SpotifyPaging<T> {
  readonly href: string;
  readonly items: T[];
  readonly limit: number;
  readonly next: string | null;
  readonly offset: number;
  readonly previous: string | null;
  readonly total: number;
  owner: string;
}

export interface SpotifyPlaylist {
  collaborative: boolean;
  description: string | null;
  external_urls: ExternalUrl;
  href: string;
  readonly id: string;
  images: Image[];
  name: string;
  readonly owner: SpotifyUser;
  public: boolean | null;
  snapshot_id: string;
  tracks: SpotifyPaging<PlaylistTrack>;
  readonly type: string;
  uri: string;
}

export interface ExternalUrl {
  readonly key: string;
  readonly value: string;
}

export interface ExternalId {
  readonly key: 'isrc' | 'ean' | 'upc';
  readonly value: string;
}

export interface Followers {
  readonly href: string;
  readonly total: number;
}

export interface Image {
  readonly height: number;
  readonly url: string;
  readonly width: number;
}

export interface PlaylistTrack {
  readonly added_at: string;
  readonly added_by: SpotifyUser;
  readonly is_local: boolean;
  readonly track: Track;
}

export interface Track {
  readonly album: SimplifiedAlbum;
  readonly artists: SimplifiedArtist[];
  readonly available_markets: string[];
  readonly disc_number: number;
  readonly duration_ms: number;
  readonly explicit: boolean;
  readonly external_ids: ExternalId[];
  readonly external_urls: ExternalUrl[];
  readonly href: string;
  readonly id: string;
  readonly is_playable: boolean;
  readonly linked_from: any;
  readonly restrictions: any;
  readonly name: string;
  readonly popularity: number;
  readonly preview_url: string;
  readonly track_number: number;
  readonly type: string;
  readonly uri: string;
  readonly is_local: boolean;
}

export interface SimplifiedAlbum {
  readonly album_group?: string;
  readonly album_type: string;
  readonly artists: SimplifiedArtist[];
  readonly available_markets: string[];
  readonly external_urls: ExternalUrl[];
  readonly href: string;
  readonly id: string;
  readonly images: Image[];
  readonly name: string;
  readonly release_date: string;
  readonly release_date_precision: string;
  readonly restrictions: any;
  readonly type: string;
  readonly uri: string;
}

export interface SimplifiedArtist {
  readonly external_urls: ExternalUrl[];
  readonly href: string;
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly uri: string;
}
