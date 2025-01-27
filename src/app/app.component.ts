import { Component, OnInit } from '@angular/core';
import { SpotifyAuthService } from './services/spotify-auth.service';
import { RouterOutlet } from '@angular/router';
import { Profile } from './interfaces/profile';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit{
  clientId: string = '8c075a7f139146519b4e9fac7ce3439d'; // Add your client ID
  accessToken: string | null = null;
  profile: Profile | null = null;

  constructor(private spotifyAuth: SpotifyAuthService) {}

  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    
    if (!code) {
        this.spotifyAuth.redirectToAuthCodeFlow(this.clientId);
    } else {
        const accessToken = await this.spotifyAuth.getAccessToken(this.clientId, code);
        this.profile = await this.fetchProfile(accessToken);
    }
  }

  async fetchProfile(token: string): Promise<Profile> {
    const result = await fetch("https://api.spotify.com/v1/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  
    if (!result.ok) {
      throw new Error(`Failed to fetch profile: ${result.statusText}`);
    }
  
    // Assert the type of the JSON response
    const profile: Profile = await result.json();
    return profile;
  }
  

  populateUI(profile: any) {
    document.getElementById("displayName")!.innerText = profile.display_name;
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar")!.appendChild(profileImage);
    }
    document.getElementById("id")!.innerText = profile.id;
    document.getElementById("email")!.innerText = profile.email;
    document.getElementById("uri")!.innerText = profile.uri;
    document.getElementById("uri")!.setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url")!.innerText = profile.href;
    document.getElementById("url")!.setAttribute("href", profile.href);
    document.getElementById("imgUrl")!.innerText = profile.images[0]?.url ?? '(no profile image)';
}
}