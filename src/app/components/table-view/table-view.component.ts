import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpotifyService } from '../../services/spotify/spotify.service';
import { TopArtistsResponse } from '../../interfaces/artist';
import { TopTracksResponse } from '../../interfaces/track';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-table-view',
  imports: [NgIf, NgFor, CommonModule],
  templateUrl: './table-view.component.html',
  styleUrl: './table-view.component.scss'
})
export class TableViewComponent implements OnInit {
  topArtists: TopArtistsResponse | null = null;
  tableType: 'artists' | 'tracks' = 'artists';

  constructor(private spotifyService: SpotifyService) {}

  /** @inheritdoc */
  ngOnInit(): void {
    // TODO: Get a param from the url to determine if artists or tracks is supposed to be displayed.
    this.spotifyService.get<TopArtistsResponse>('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=50&offset=0').subscribe({
      next: response => {
        this.topArtists = response;
        if (!response.next) {
          return;
        }
        this.spotifyService.get<TopArtistsResponse>(response.next).subscribe({
          next: response => {
            this.topArtists?.items.push(...response.items);
          },
          error: (err) => {
            console.error('Error fetching top artists:', err);
          }
        });
      },
      error: (err) => {
        console.error('Error fetching top artists:', err);
      }
    });
  }
}
