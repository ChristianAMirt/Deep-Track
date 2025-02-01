import { ChangeDetectorRef, Component, createPlatform, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Artist, TopArtistsResponse } from './interfaces/artist';
import { SpotifyService } from './services/spotify/spotify.service';
import { Profile } from './interfaces/profile';
import { NgFor, NgIf } from '@angular/common';
import { PlayerState } from './interfaces/player-state';
import { Subscription, switchMap, timer } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, NgFor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent implements OnInit, OnDestroy {
  profile: Profile | null = null;
  topArtists: Artist[] | null = null;
  playerState: PlayerState | null = null;
  subscription: Subscription | null = null;

  constructor(private spotifyService: SpotifyService, private cdr: ChangeDetectorRef) {}

  /** @inheritdoc */
  ngOnInit() {
    // Get user profile
    this.spotifyService.getUserProfile().subscribe({
      next: (profile: Profile) => {
        this.profile = profile;
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
        this.spotifyService.redirectToAuthCodeFlow();
      }
    });
    // Get user top artists
    this.spotifyService.getTop5Artists().subscribe({
      next: (artistsResponse: TopArtistsResponse) => {
        this.topArtists = artistsResponse.items;
      },
      error: (err) => {
        console.error('Error fetching top artists:', err);
        this.spotifyService.redirectToAuthCodeFlow();
      }
    });
    // Get player state and poll the API every 1 seconds
    this.subscription = timer(0, 1000)
    .pipe(switchMap(() => this.spotifyService.getPlayerState())).subscribe({
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
        this.spotifyService.redirectToAuthCodeFlow();
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