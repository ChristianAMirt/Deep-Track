import { Component, OnDestroy, OnInit } from '@angular/core';
import { Artist, TopArtistsResponse } from '../../interfaces/artist';
import { Subscription, switchMap, timer } from 'rxjs';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { NgFor, NgIf } from '@angular/common';
import { PlayerState } from '../../interfaces/player-state';
import { Track, TopTracksResponse } from '../../interfaces/track';

@Component({
  selector: 'app-home',
  imports: [NgIf, NgFor],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  topArtists: Artist[] | null = null;
  topTracks: Track[] | null = null;
  playerState: PlayerState | null = null;
  subscription: Subscription | null = null;

  constructor(private spotifyService: SpotifyService) {}

  /** @inheritdoc */
  ngOnInit() {
    // Get user top artists
    this.spotifyService.get<TopArtistsResponse>('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5&offset=0').subscribe({
      next: (artistsResponse: TopArtistsResponse) => {
        this.topArtists = artistsResponse.items;
      },
      error: (err) => {
        console.error('Error fetching top artists:', err);
      }
    });
    // Get user top tracks
    this.spotifyService.get<TopTracksResponse>('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=5&offset=0').subscribe({
      next: (tracksResponse: TopTracksResponse) => {
        this.topTracks = tracksResponse.items;
      },
      error: (err) => {
        console.error('Error fetching top tracks:', err);
      }
    });
    // Get player state and poll the API every 1 seconds
    this.subscription = timer(0, 1000)
    .pipe(switchMap(() => this.spotifyService.get<PlayerState>('https://api.spotify.com/v1/me/player'))).subscribe({
      next: (playerState: PlayerState) => {
        if (playerState) {
          if (this.playerState === null || playerState.item.id !== this.playerState.item.id) {
            this.playerState = playerState;
          }
        } else {
          this.playerState = null;
        }
      },
      error: (err) => {
        console.error('Error fetching player state', err);
        this.playerState = null;
      },
    });
  }

  /** @inheritdoc */
  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Gets the artist names from the player state and adds commas between each.
   * @returns A comma seperated string of artist names.
   */
  getArtistNames(): string {
    let names = '';
    let index = 0;
    this.playerState?.item.artists.forEach( artist => {
      if (index === 0) {
        names = artist.name;
      } else {
        names += `, ${artist.name}`;
      }
      index++;
    });
    return names;
  }
}
