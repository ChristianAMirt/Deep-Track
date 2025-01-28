import { ChangeDetectorRef, Component, createPlatform, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Artist, TopArtistsResponse } from './interfaces/artist';
import { SpotifyService } from './services/spotify/spotify.service';
import { Profile } from './interfaces/profile';
import { NgFor, NgIf } from '@angular/common';
import { AuthResponse } from './interfaces/auth-response';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf, NgFor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit{
  profile: Profile | null = null;
  topArtists: Artist[] = [];

  constructor(private spotifyService: SpotifyService, private cdr: ChangeDetectorRef) {}

  /** @inheritdoc */
  ngOnInit() {
    console.log('app.component initialized')

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // Check if user has already authenticated and redirect them if not
    if (code) {
      this.spotifyService.getAuthData(code).subscribe({
        next: (authResponse: AuthResponse) => {
          // Get user profile
          this.spotifyService.getUserProfile(authResponse.access_token).subscribe({
            next: (profile: Profile) => {
              this.profile = profile;
            },
            error: (err) => console.error('Error fetching user profile:', err),
          });
          // Get user top artists
          this.spotifyService.getTop5Artists(authResponse.access_token).subscribe({
            next: (artistsResponse: TopArtistsResponse) => {
              this.topArtists = artistsResponse.items;
            },
            error: (err) => console.error('Error fetching top artists:', err),
          });
        },
        error: (err) => console.error('Error during authentication:', err),
      });
    } else {
      this.spotifyService.redirectToAuthCodeFlow();
    }
  }
}