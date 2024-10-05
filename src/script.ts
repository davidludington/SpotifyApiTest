const clientId = "b8f06923f3c743deaee6a67afa7b5559"; // Replace with your client id
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    const topArtists = await fetchTopArtists(accessToken);
    const topTracks = await fetchTopTracks(accessToken);
    console.log(topArtists, topTracks);
    
    populateUI(profile, topArtists, topTracks);
}

export async function redirectToAuthCodeFlow(clientId: string) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email user-top-read");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier: string) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId: string, code: string): Promise<string> {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier!);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token: string): Promise<any> {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchTopArtists(token: string): Promise<any> {
    const result = await fetch("https://api.spotify.com/v1/me/top/artists", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await result.json();
    console.log("Top Artists Data:", data);
    return data;
}

async function fetchTopTracks(token: string): Promise<any> {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json(); 
}

function populateUI(profile: any, topArtists: any, topTracks: any) {
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

    const artistsDiv = document.getElementById("topArtists");
    topArtists.items.forEach((artist: any) => {
        const artistCard = document.createElement("div");
        artistCard.classList.add("artist-card");

        const artistImage = new Image(100, 100);
        if (artist.images[0]) {
            artistImage.src = artist.images[0].url;
        } else {
            artistImage.src = 'default-artist-image.png'; // Add a default image or handle if no image exists
        }

        const artistName = document.createElement("p");
        artistName.classList.add("artist-name");
        artistName.innerText = artist.name;

        artistCard.appendChild(artistImage);
        artistCard.appendChild(artistName);
        artistsDiv!.appendChild(artistCard);
    });

    const tracksDiv = document.createElement("div");
    tracksDiv.id = "topTracks";
    tracksDiv.style.marginTop = "20px";
    tracksDiv.style.display = "grid";
    tracksDiv.style.gridTemplateColumns = "repeat(auto-fit, minmax(150px, 1fr))";
    tracksDiv.style.gap = "15px";

    document.getElementById("profile")!.appendChild(tracksDiv); // Append the tracks div to the profile section

    topTracks.items.forEach((track: any) => {
        const trackCard = document.createElement("div");
        trackCard.classList.add("track-card");

        const trackImage = new Image(100, 100);
        if (track.album.images[0]) {
            trackImage.src = track.album.images[0].url;
        } else {
            trackImage.src = 'default-track-image.png';
        }

        const trackName = document.createElement("p");
        trackName.classList.add("track-name");
        trackName.innerText = track.name;

        const trackArtist = document.createElement("p");
        trackArtist.classList.add("track-artist");
        trackArtist.innerText = `by ${track.artists.map((artist: any) => artist.name).join(", ")}`;

        trackCard.appendChild(trackImage);
        trackCard.appendChild(trackName);
        trackCard.appendChild(trackArtist);
        tracksDiv!.appendChild(trackCard);
    });

}