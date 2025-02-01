import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, from, map, Observable, of, switchMap } from 'rxjs';
import { AuthResponse } from '../../interfaces/auth-response';
import { Profile } from '../../interfaces/profile';
import { TopArtistsResponse } from '../../interfaces/artist';
import { PlayerState } from '../../interfaces/player-state';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  clientId: string = '8c075a7f139146519b4e9fac7ce3439d'; // Add your client ID
  private authResponse$: BehaviorSubject<AuthResponse | null> = new BehaviorSubject<AuthResponse | null>(null);

  constructor(private http: HttpClient) {}

  // #region Authentication functions
  /**
   * Creates encrption key pair and redirects user to Spotify authetication.
   * @param clientId The ID of the users Spotify developer account.
   */
  redirectToAuthCodeFlow(): void {
    // Detect environment and set redirect URI
    const redirectUri = this.getRedirectUri();
    if (!redirectUri) {
      throw new Error('Environment not recognized.');
    }
    
    const verifier = this.generateCodeVerifier(128);

    // Create a key/value for the code verifier and store in browser storage
    localStorage.setItem('verifier', verifier);

    this.generateCodeChallenge(verifier).subscribe({
      next: challenge => {
        const params = new HttpParams()
        .set('client_id', this.clientId)
        .set('response_type', 'code')
        .set('redirect_uri', redirectUri)
        .set('scope', 'user-read-private user-read-email user-top-read user-read-playback-state') //Add scopes if 403 error occurs
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
  getAuthData(redirectUri: string, code: string): Observable<AuthResponse> {
    const verifier = localStorage.getItem('verifier');

    if (!verifier) {
      throw new Error('Code verifier is missing from localStorage.');
    }

    const body = new HttpParams()
      .set('client_id', this.clientId)
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('redirect_uri', redirectUri)
      .set('code_verifier', verifier);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http
    .post<AuthResponse>('https://accounts.spotify.com/api/token', body, { headers })
    .pipe(
      map((authResponse) => {
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

  /**
   * Determines the appropriate redirect URI based on the environment.
   * @returns The correct URI for the environment or null.
   */
  private getRedirectUri(): string | null {
    const currentUrl = window.location.href;
    if (currentUrl.includes('localhost')) {
      return 'http://localhost:4200/callback';
    } else if (currentUrl.includes('github.io')) {
      return 'https://christianamirt.github.io/Deep-Track/callback';
    }
    return null; // Unknown environment
  }

  /**
   * Get access token from cache or fetch a new one if needed.
   * @returns An observable of the access token.
   */
  private getAccessToken(): Observable<string> {
    // First check service property for value
    const cachedAuth = this.authResponse$.getValue();

    if (cachedAuth && cachedAuth.access_token) {
      return of(cachedAuth.access_token);
    }

    // If no cached token, attempt to retrieve from localStorage
    const storedAuth = localStorage.getItem('authResponse');
    if (storedAuth) {
      const parsedAuth = JSON.parse(storedAuth) as AuthResponse;
      this.authResponse$.next(parsedAuth);
      return of(parsedAuth.access_token);
    }

    // If token not stored, check URL for code, and try to make a request for access token (case where user was redirected)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      // Detect environment and set redirect URI
      const redirectUri = this.getRedirectUri();
      if (!redirectUri) {
        return of('').pipe(
          switchMap(() => {
            throw new Error('Environment not recognized.');
          })
        );
      }
      return this.getAuthData(redirectUri, code).pipe(
        map(authResponse => {
          // Cache in service and local storage
          this.authResponse$.next(authResponse);
          localStorage.setItem('authResponse', JSON.stringify(authResponse));
          return authResponse.access_token;
        })
      );
    }

    // If no stored token, return an error
    return of('').pipe(
      switchMap(() => {
        throw new Error('No access token available. User may need to log in.');
      })
    );
  }
  // #endregion

  /**
   * Template function to make API calls.
   * @param url The URL to fetch data from.
   * @returns The requested record.
   */
  get<T>(url: string): Observable<T> {
    return this.getAccessToken().pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('No access token available.');
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
        });

        return this.http.get<T>(url, { headers });
      })
    );
  }

  /**
   * Retrives a users profile from Spotify.
   * @returns An observer of the Profile.
   */
  getUserProfile(): Observable<Profile> {
    return this.getAccessToken().pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('No access token available.');
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
        });

        return this.http.get<Profile>('https://api.spotify.com/v1/me', { headers });
      })
    );
  }

  /**
   * Get the current top 5 artist from the past 4 weeks.
   * @param accessToken The token require for API call.
   * @returns An observer of a list of artists.
   */
  getTop5Artists(): Observable<TopArtistsResponse> {
    return this.getAccessToken().pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('No access token available.');
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
        });

        return this.http.get<TopArtistsResponse>('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5&offset=0', { headers });
      })
    );
  }

  getPlayerState(): Observable<PlayerState> {
    return this.getAccessToken().pipe(
      switchMap(token => {
        if (!token) {
          throw new Error('No access token available.');
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`
        });

        return this.http.get<PlayerState>('https://api.spotify.com/v1/me/player', { headers });
      })
    );
  }
}
