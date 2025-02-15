import { Component, OnInit } from '@angular/core';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { Profile } from '../../interfaces/profile';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  profile: Profile | null = null;


  constructor(private spotifyService: SpotifyService, private router: Router) {}

  /** @inheritdoc */
  ngOnInit(): void {
    // Get user profile
    this.spotifyService.get<Profile>('https://api.spotify.com/v1/me').subscribe({
      next: (profile: Profile) => {
        this.profile = profile;
        setTimeout(() => {
          // Wait just to see the nice loading screen
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
        this.spotifyService.redirectToAuthCodeFlow();
      }
    });
  }

  /** Redirects the user back to the homepage. */
  onTitleClick() {
    this.router.navigate(['/home']);
  }

  /** Opens a new tab of the users Spotify profile. */
  onProfileClick() {
    window.open(this.profile?.external_urls.spotify, "_blank");
  }
}
