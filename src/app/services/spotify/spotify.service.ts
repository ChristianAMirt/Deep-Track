import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { from } from 'rxjs/internal/observable/from';
import { map } from 'rxjs/internal/operators/map';
import { AuthResponse } from '../../interfaces/auth-response';
import { Profile } from '../../interfaces/profile';
import { Artist, TopArtistsResponse } from '../../interfaces/artist';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  redirectUri: string = 'http://localhost:4200/callback';
  clientId: string = '8c075a7f139146519b4e9fac7ce3439d'; // Add your client ID
  profile: Profile | null = null;
  authResponse: AuthResponse | null = null;

  constructor(private http: HttpClient) {}

  // #region Authentication functions
  
  /**
   * Creates encrption key pair and redirects user to Spotify authetication.
   * @param clientId The ID of the users Spotify developer account.
   */
  redirectToAuthCodeFlow(): void {
    const verifier = this.generateCodeVerifier(128);

    // Create a key/value for the code verifier and store in browser storage
    localStorage.setItem('verifier', verifier);

    this.generateCodeChallenge(verifier).subscribe({
      next: challenge => {
        const params = new HttpParams()
        .set('client_id', this.clientId)
        .set('response_type', 'code')
        .set('redirect_uri', this.redirectUri)
        .set('scope', 'user-read-private user-read-email user-top-read') //Add scopes if 403 error occurs
        .set('code_challenge_method', 'S256')
        .set('code_challenge', challenge);
  
        window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
      }, error: (ex) => console.log(ex)
    });
  }

  /**
   * Exchange authorization code for authentication token data.
   * @param clientId The ID of the users Spotify developer account.
   * @param code The challenge code to verify user.
   * @returns An observer of the access token string.
   */
  getAuthData(code: string): Observable<AuthResponse> {
    const verifier = localStorage.getItem('verifier');

    if (!verifier) {
      throw new Error('Code verifier is missing from localStorage.');
    }

    const body = new HttpParams()
      .set('client_id', this.clientId)
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('redirect_uri', this.redirectUri)
      .set('code_verifier', verifier);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http
    .post<AuthResponse>('https://accounts.spotify.com/api/token', body, { headers })
    .pipe(
      map((authResponse) => {
        this.authResponse = authResponse; // Cache the authResponse
        return authResponse;
      })
    );
  }

  /**
   * Helper to generate code verifier (the longer, the better).
   * @param length The Length of code (max 128).
   * @returns A string of the code verifier.
   */
  private generateCodeVerifier(length: number): string {
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';

    // Set length to max if larger
    if (length > 128) {
      length = 128;
    }

    // Create a random code from the possible chars
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  /**
   * Helper to generate code challenge.
   * @param codeVerifier The code verifier to encrypt.
   * @returns An observer of the code challenge string.
   */
  private generateCodeChallenge(codeVerifier: string): Observable<string> {
    const data = new TextEncoder().encode(codeVerifier);
    
    // Use from to wrap the Promise returned by crypto.subtle.digest into an Observable
    return from(crypto.subtle.digest('SHA-256', data)).pipe(
      map(digest => {
        // Convert the digest into a base64 string and perform necessary replacements
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      })
    );
  }
  // #endregion

  /**
   * Retrives a users profile from Spotify.
   * @param accessToken The token require for API call.
   * @returns An observer of the Profile.
   */
  getUserProfile(accessToken: string): Observable<Profile> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });
    return this.http.get<Profile>('https://api.spotify.com/v1/me', { headers });
  }

  /**
   * Get the current top 5 artist from the past 4 weeks.
   * @param accessToken The token require for API call.
   * @returns An observer of a list of artists.
   */
  getTop5Artists(accessToken: string): Observable<TopArtistsResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`
    });
    return this.http.get<TopArtistsResponse>('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5&offset=0', { headers });
  }
}
