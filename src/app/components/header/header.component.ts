import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { Profile } from '../../interfaces/profile';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  profile: Profile | null = null;


  constructor(private spotifyService: SpotifyService) {}

  /** @inheritdoc */
  ngOnInit(): void {
    // Get user profile
    this.spotifyService.get<Profile>('https://api.spotify.com/v1/me').subscribe({
      next: (profile: Profile) => {
        this.profile = profile;
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
        this.spotifyService.redirectToAuthCodeFlow();
      }
    });
  }
}
