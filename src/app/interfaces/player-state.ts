import { Artist } from "./artist";
import { Album } from "./track";

export interface PlayerState {
    device: {
        id: string;
        is_active: boolean;
        is_private_session: boolean;
        is_restricted: boolean;
        name: string;
        type: string;
        volume_percent: number;
        supports_volume: boolean;
    };
    repeat_state: string;
    shuffle_state: boolean;
    context: {
        type: string;
        href: string;
        external_urls: {
        spotify: string;
        };
        uri: string;
    };
    timestamp: number;
    progress_ms: number;
    is_playing: boolean;
    item: {
        album: Album;
        artists: Artist[];
        available_markets: string[];
        disc_number: number;
        duration_ms: number;
        explicit: boolean;
        external_ids: {
        isrc: string;
        };
        external_urls: {
        spotify: string;
        };
        href: string;
        id: string;
        name: string;
        popularity: number;
        preview_url: string | null;
        track_number: number;
        type: string;
        uri: string;
        is_local: boolean;
    };
    currently_playing_type: string;
    actions: {
        disallows: {
        resuming: boolean;
        };
    };
    smart_shuffle: boolean;
}
  