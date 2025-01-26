import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SpotifyAuthService {
  private redirectUri = 'http://localhost:4200/callback';
  private verifierKey = 'verifier';

  constructor(private http: HttpClient) {}

  // Step 1: Redirect to Spotify's Auth Code Flow
  async redirectToAuthCodeFlow(clientId: string): Promise<void> {
    const verifier = this.generateCodeVerifier(128);
    const challenge = await this.generateCodeChallenge(verifier);

    localStorage.setItem(this.verifierKey, verifier);

    const params = new HttpParams()
      .set('client_id', clientId)
      .set('response_type', 'code')
      .set('redirect_uri', this.redirectUri)
      .set('scope', 'user-read-private user-read-email')
      .set('code_challenge_method', 'S256')
      .set('code_challenge', challenge);

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  // Step 2: Exchange Authorization Code for Access Token
  async getAccessToken(clientId: string, code: string): Promise<string> {
    const verifier = localStorage.getItem(this.verifierKey);

    if (!verifier) {
      throw new Error('Code verifier is missing from localStorage.');
    }

    const body = new HttpParams()
      .set('client_id', clientId)
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('redirect_uri', this.redirectUri)
      .set('code_verifier', verifier);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const response = await this.http
      .post<any>('https://accounts.spotify.com/api/token', body.toString(), { headers })
      .toPromise();

    return response.access_token;
  }

  // Helper to Generate Code Verifier
  private generateCodeVerifier(length: number): string {
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  // Helper to Generate Code Challenge
  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(
      String.fromCharCode(...new Uint8Array(digest))
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
