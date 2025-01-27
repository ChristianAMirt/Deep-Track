import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Artist } from './interfaces/artist';
import { NgIf } from '@angular/common';
import { SpotifyService } from './services/spotify/spotify.service';
import { Profile } from './interfaces/profile';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit{
  profile: Profile = <Profile>{};
  topArtists: Artist[] | null = null;

  constructor(private spotifyService: SpotifyService) {}

  /** @inheritdoc */
  ngOnInit() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      this.spotifyService.getAuthData(this.spotifyService.clientId, code).subscribe({
        next: () => {
          this.spotifyService.getUserProfile().subscribe({
            next: (profile) => {
              console.log('User Profile:', profile);
            },
            error: (err) => console.error('Error fetching user profile:', err),
          });
        },
        error: (err) => console.error('Error during authentication:', err),
      });
    }
  }

  async fetchTopArtists(token: string): Promise<void> {
    const result = await fetch('https://api.spotify.com/v1/me/top/artists?time_range=long_term&offset=0', {
      method: 'GET', headers: { Authorization: `Bearer ${token}` }
    });

    this.topArtists = await result.json();
  }
}