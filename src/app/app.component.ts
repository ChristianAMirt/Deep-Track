import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Artist } from './interfaces/artist';
import { SpotifyService } from './services/spotify/spotify.service';
import { Profile } from './interfaces/profile';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit{
  profile: Profile | null = null;
  topArtists: Artist[] | null = null;

  constructor(private spotifyService: SpotifyService) {}

  /** @inheritdoc */
  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      this.spotifyService.getAuthData(code).subscribe({
        next: (authResponse) => {
          this.seeValues(authResponse);
          this.spotifyService.getUserProfile(authResponse.access_token).subscribe({
            next: (profile) => {
              console.log('User Profile:', profile);
              this.seeValues(profile);
            },
            error: (err) => console.error('Error fetching user profile:', err),
          });
        },
        error: (err) => console.error('Error during authentication:', err),
      });
    } else {
      this.spotifyService.redirectToAuthCodeFlow();
    }
  }

  seeValues(something: any) {
    console.log('Pause.');
  }

  async fetchTopArtists(token: string): Promise<void> {
    const result = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=long_term&offset=0', {
      method: 'GET', headers: { Authorization: `Bearer ${token}` }
    });

    this.topArtists = await result.json();
  }
}