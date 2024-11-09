  const API_KEY = '431fb541e27bceeb9db2f4cab69b54e1';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';
    const baseImageUrl = 'https://image.tmdb.org/t/p/w1280';
    const baseVideoUrl = 'https://www.youtube.com/embed/';
    let currentBgIndex = 0;
    let heroBg = document.querySelector('.hero-bg1');
    const trailersContainer = document.getElementById('trailersContainer');
    const modal = document.getElementById('trailerModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalOverview = document.getElementById('modalOverview');
    const modalDetails = document.getElementById('modalDetails');
    const categories = document.getElementById('categories');
    const loading = document.getElementById('loading');

    //music
     
    document.addEventListener('DOMContentLoaded', function () {
        var audio = document.getElementById('audio');
        var audioButton = document.getElementById('audioButton');
        var volume = 0;
    
        // Initialize audio volume
        audio.volume = volume;
    
        // Create an IntersectionObserver
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    fadeInAudio();
                } else {
                    fadeOutAudio();
                }
            });
        }, {
            threshold: [0.0, 0.5, 1.0]
        });
    
        // Observe the audio button
        observer.observe(audioButton);
    
        // Function to fade in audio
        function fadeInAudio() {
            if (!audio.playing) {
                audio.play();
            }
            var fadeAudio = setInterval(function () {
                if (volume < 1.0) {
                    volume += 0.05;
                    audio.volume = volume;
                } else {
                    clearInterval(fadeAudio);
                }
            }, 100);
        }
    
        // Function to fade out audio
        function fadeOutAudio() {
            var fadeAudio = setInterval(function () {
                if (volume > 0.0) {
                    volume -= 0.05;
                    audio.volume = volume;
                } else {
                    audio.pause();
                    clearInterval(fadeAudio);
                }
            }, 100);
        }
         });
    
    // Helper to check if audio is playing
    Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
        get: function(){
            return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
        }
    });
    

    async function fetchData(endpoint) {
        try {
            const response = await axios.get(`${BASE_URL}${endpoint}`, {
                params: {
                    api_key: API_KEY,
                    language: 'ar-SA'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    }

    // Modify the existing createMovieCard function to include drag attributes
    function createMovieCard(item) {
        return `
            <div class="movie-card" 
                 draggable="true" 
                 data-id="${item.id}" 
                 data-type="${item.media_type || (item.first_air_date ? 'tv' : 'movie')}">
                <img src="${IMG_BASE_URL}${item.poster_path}" alt="${item.title || item.name}">
                <div class="movie-info">
                    <h3 class="movie-title">${item.title || item.name}</h3>
                    <div class="movie-rating">
                        <i class="fas fa-star"></i>
                        <span>${item.vote_average.toFixed(1)}</span>
                    </div>
                </div>
                <button class="add-to-list" title="أضف إلى قائمتي"><i class="fas fa-plus"></i></button>
            </div>
        `;
    }
    
    
    async function displayMovies(endpoint, containerId) {
        const container = document.getElementById(containerId);
        const data = await fetchData(endpoint);
        if (data && data.results) {
            container.innerHTML = data.results.slice(0, 20).map(createMovieCard).join('');
        }
    }

    async function displayGenres() {
        const container = document.getElementById('genres-container');
        const data = await fetchData('/genre/movie/list');
        if (data && data.genres) {
            container.innerHTML = data.genres.map(genre => 
                `<span class="genre-tag" data-id="${genre.id}">${genre.name}</span>`
            ).join('');
        }
    }

    async function searchMovies(query) {
        const data = await fetchData(`/search/multi?query=${encodeURIComponent(query)}`);
        return data.results.slice(0, 5);
    }

    function displaySearchResults(results) {
        const container = document.getElementById('search-results');
        container.innerHTML = results.map(item => 
            `<div class="search-result-item" data-id="${item.id}" data-type="${item.media_type}">
                ${item.title || item.name}
            </div>`
        ).join('');
        container.style.display = 'block';
    }

    async function showMovieDetails(id, type) {
        const data = await fetchData(`/${type}/${id}`);
        if (data) {
            document.getElementById('modal-poster').src = `${IMG_BASE_URL}${data.poster_path}`;
            document.getElementById('modal-title').textContent = data.title || data.name;
            document.getElementById('modal-rating').innerHTML = `
                <i class="fas fa-star"></i>
                <span>${data.vote_average.toFixed(1)}</span>
            `;
            document.getElementById('modal-overview').textContent = data.overview;
            document.getElementById('modal-details').innerHTML = `
                <p><strong>تاريخ الإصدار:</strong> ${data.release_date || data.first_air_date}</p>
                <p><strong>اللغة الأصلية:</strong> ${data.original_language}</p>
                <p><strong>التصنيفات:</strong> ${data.genres.map(g => g.name).join(', ')}</p>
                ${type === 'movie' ? `<p><strong>المدة:</strong> ${data.runtime} دقيقة</p>` : ''}
                ${type === 'tv' ? `<p><strong>عدد المواسم:</strong> ${data.number_of_seasons}</p>` : ''}
            `;

            // Fetch and display trailer
            const videos = await fetchData(`/${type}/${id}/videos`);
            if (videos && videos.results.length > 0) {
                const trailer = videos.results.find(video => video.type === "Trailer") || videos.results[0];
                document.getElementById('modal-trailer').innerHTML = `
                    <h3>العرض الدعائي</h3>
                    <iframe src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>
                `;
            }

            // Fetch and display cast
            const credits = await fetchData(`/${type}/${id}/credits`);
            if (credits && credits.cast) {
                const castList = credits.cast.slice(0, 20).map(actor => `
                    <div class="cast-item">
                        <img src="${IMG_BASE_URL}${actor.profile_path}" alt="${actor.name}">
                        <p>${actor.name}</p>
                    </div>
                `).join('');
                document.getElementById('modal-cast-list').innerHTML = castList;
            }

            // Fetch and display recommendations
            const recommendations = await fetchData(`/${type}/${id}/recommendations`);
            if (recommendations && recommendations.results) {
                const recList = recommendations.results.slice(0, 20).map(item => `
                    <div class="recommendation-item" data-id="${item.id}" data-type="${type}">
                        <img src="${IMG_BASE_URL}${item.poster_path}" alt="${item.title || item.name}">
                        <p>${item.title || item.name}</p>
                        <div class="movie-rating">
                            <i class="fas fa-star"></i>
                            <span>${item.vote_average.toFixed(1)}</span>
                        </div>
                    </div>
                `).join('');
                document.getElementById('modal-recommendations-list').innerHTML = recList;
            }

            document.getElementById('movie-modal').style.display = 'block';
        }
    }

    //Networks movies Tv-shows
    async function displayNetworks() {
        const container = document.getElementById('network-container');
        const networks = [
            { id: 213, name: 'Netflix', logo: '/wwemzKWzjKYJFfCeiB57q3r4Bcm.png' },
            { id: 19, name: 'FOX', logo: '/1DSpHrWyOORkL9N2QHX7Adt31mQ.png' },
            { id: 2552, name: 'Apple TV+', logo: '/4KAy34EHvRM25Ih8wb82AuGU7zJ.png' },
            { id: 2739, name: 'Disney+', logo: '/gJ8VX6JSu3ciXHuC2dDGAo2lvwM.png' },
            { id: 49, name: 'HBO', logo: '/tuomPhY2UtuPTqqFnKMVHvSb724.png' },
            { id: 4, name: 'BBC One', logo: '/mVn7xESaTNmjBUyUtGNvDQd3CT1.png' },
            { id: 56, name: 'Cartoon Network', logo: '/c5OC6oVCg6QP4eqzW6XIq17CQjI.png' },
            { id: 318, name: 'Starz', logo: '/GMDGZk9iDG4WDijY3VgUgJeyus.png' },
            { id: 67, name: 'Showtime', logo: '/Allse9kbjiP6ExaQrnSpIhkurEi.png' },
            { id: 16, name: 'CBS', logo: '/nm8d7P7MJNiBLdgIzUK0gkuEA4r.png' },
            { id: 174, name: 'AMC', logo: '/pmvRmATOCaDykE6JrVoeYxlFHw3.png' },
            { id: 6, name: 'NBC', logo: '/o3OedEP0f9mfZr33jz2BfXOUK5.png' },
            { id: 13, name: 'Nickelodeon', logo: '/ikZXxg6GnwpzqiZbRPhJGaZapqB.png' },
            { id: 14, name: 'PBS', logo: '/hp2Fs7AIdsMlEjiDUC1V8Ows2jM.png' },
            { id: 24, name: 'Bravo', logo: '/wX5HsfS47u6UUCSpYXqaQ1x2qdu.png' },
            { id: 54, name: 'Disney Channel', logo: '/rxhJszKVAvAZYTmF0vfRHfyo4Fb.png' }, // تم تصحيح ID من 33 إلى 54
            { id: 77, name: 'Syfy', logo: '/iYfrkobwDhTOFJ4AXYPSLIEeaAT.png' },
            { id: 3186, name: 'BBC America', logo: '/8Js4sUaxjE3RSxJcOCDjfXvhZqz.png' }, // تم تصحيح ID من 247 إلى 3186
            { id: 47, name: 'Comedy Central', logo: '/6ooPjtXufjsoskdJqj6pxuvHEno.png' }, // تم تصحيح ID من 288 إلى 47
            { id: 359, name: 'Cinemax', logo: '/6mSHSquNpfLgDdv6VnOOvC5Uz2h.png' },
            { id: 453, name: 'Hulu', logo: '/pqUTCleNUiTLAVlelGxUgWn1ELh.png' },
            { id: 181, name: 'HLN', logo: '/5Gjx3BpBh0NRagEeuqPd0NFGRIz.png' },
        ];
        container.innerHTML = networks.map(createNetworkItem).join('');
    }
    
    //Anime Networks
    //Networks movies Tv-shows
async function displayNetworks() {
    const container = document.getElementById('network-container');
    const networks = [
        { id: 213, name: 'Netflix', logo: '/wwemzKWzjKYJFfCeiB57q3r4Bcm.png' },
        { id: 19, name: 'FOX', logo: '/1DSpHrWyOORkL9N2QHX7Adt31mQ.png' },
        { id: 1024, name: 'Amazon', logo: '/ifhbNuuVnlwYy5oXA5VIb2YR8AZ.png' },
        { id: 6, name: 'Amazon Freevee', logo: '/n0hqN6lKlBENn9WAbSC2WwHRPnS.png' },
        { id: 420, name: 'Marvel', logo: '/837VMM4wOkODc1idNxGT0KQJlej.png' },
        { id: 4, name: 'Paramount Pictures', logo: '/4knr4ozp2IQrA3SMQlLSYKcM3ML.png' },
        { id: 4330, name: 'Paramount +', logo: '/wFVDi1bYoyriigHFKIRSdJ9l8kD.png' },
        { id: 5, name: 'Columbia Pictures', logo: '/71BqEFAF4V3qjjMPCpLuyJFB9A.png' },
        { id: 174, name: 'Warner Bros. Pictures', logo: '/zhD3hhtKB5qyv7ZeL4uLpNxgMVU.png' },
        { id: 2, name: 'Pixar', logo: '/1TjvGVDMYsj6JBxOAkUHpPEwLf7.png' },
        { id: 19, name: 'The CW', logo: '/hEpcdJ4O6eitG9ADSnDXNUrlovS.png' },
        { id: 31, name: 'FX', logo: '/aexGjtcs42DgRtZh7zOxayiry4J.png' },
        { id: 2552, name: 'Apple TV+', logo: '/4KAy34EHvRM25Ih8wb82AuGU7zJ.png' },
        { id: 2739, name: 'Disney+', logo: '/gJ8VX6JSu3ciXHuC2dDGAo2lvwM.png' },
        { id: 55, name: 'Disney XD', logo: '/nKM9EnV7jTpt3MKRbhBusJ03lAY.png' },
        { id: 49, name: 'HBO', logo: '/tuomPhY2UtuPTqqFnKMVHvSb724.png' },
        { id: 4, name: 'BBC One', logo: '/mVn7xESaTNmjBUyUtGNvDQd3CT1.png' },
        { id: 56, name: 'Cartoon Network', logo: '/c5OC6oVCg6QP4eqzW6XIq17CQjI.png' },
        { id: 318, name: 'Starz', logo: '/GMDGZk9iDG4WDijY3VgUgJeyus.png' },
        { id: 67, name: 'Showtime', logo: '/Allse9kbjiP6ExaQrnSpIhkurEi.png' },
        { id: 16, name: 'CBS', logo: '/nm8d7P7MJNiBLdgIzUK0gkuEA4r.png' },
        { id: 174, name: 'AMC', logo: '/pmvRmATOCaDykE6JrVoeYxlFHw3.png' },
        { id: 175, name: 'NBC', logo: '/o3OedEP0f9mfZr33jz2BfXOUK5.png' },
        { id: 13, name: 'Nickelodeon', logo: '/ikZXxg6GnwpzqiZbRPhJGaZapqB.png' },
        { id: 14, name: 'PBS', logo: '/hp2Fs7AIdsMlEjiDUC1V8Ows2jM.png' },
        { id: 24, name: 'Bravo', logo: '/wX5HsfS47u6UUCSpYXqaQ1x2qdu.png' },
        { id: 54, name: 'Disney Channel', logo: '/rxhJszKVAvAZYTmF0vfRHfyo4Fb.png' },
        { id: 77, name: 'Syfy', logo: '/iYfrkobwDhTOFJ4AXYPSLIEeaAT.png' },
        { id: 3186, name: 'BBC America', logo: '/8Js4sUaxjE3RSxJcOCDjfXvhZqz.png' },
        { id: 47, name: 'Comedy Central', logo: '/6ooPjtXufjsoskdJqj6pxuvHEno.png' },
        { id: 359, name: 'Cinemax', logo: '/6mSHSquNpfLgDdv6VnOOvC5Uz2h.png' },
        { id: 453, name: 'Hulu', logo: '/pqUTCleNUiTLAVlelGxUgWn1ELh.png' },
        { id: 57, name: 'Boomerang', logo: '/lkMfZclFXosrByxWf459NrXBiRY.png' },
    ];
    container.innerHTML = networks.map(createNetworkItem).join('');
}

//Anime Networks
async function displayAnimeNetworks() {
    const container = document.getElementById('anime-network-container');
    const animeNetworks = [
        { id: 1112, name: 'Crunchyroll', logo: '/gNZh44MgDBwipGA9LwozlALjSdE.png' },
        
        { id: 173, name: 'Tokyo MX', logo: '/hSdroyVthq3CynxTIIY7lnS8w1.png' },
        { id: 98, name: 'TV Tokyo', logo: '/jnuO8pZNEBLEq5YaOP1f5OkmG91.png' },
        { id: 160, name: 'BS TV Tokyo', logo: '/a19TItuT3En6OVTqQ7RQeIf4J7U.png' },
        { id: 1, name: 'Fuji TV', logo: '/yS5UJjsSdZXML0YikWTYYHLPKhQ.png' },
        { id: 57, name: 'Nippon TV', logo: '/uxaXSoT8K0S2NE5PWsBpHUl3GGU.png' },
        { id: 1163, name: 'BS4', logo: '/naTpOY8AjRtgBw0JXafrhAD8ZBT.png' },
        { id: 765, name: 'NET', logo: '/wJHlrKe9Sm6m6F3Wj1IK81P0Lm0.png' },
        { id: 68, name: 'TBS', logo: '/lUACMATs6jcscXIrzNCQzbvNVN5.png' },
        { id: 1167, name: 'Tokyo Channel 12', logo: '/4PjLiv0vGFmvjss6uYnEwBf89zE.png' },
        { id: 1168, name: 'BS Shochiku-Tokyu', logo: '/gChphRoU4rtQYqxVxNgHSFQUEQA.png' },
        { id: 88, name: 'MBS', logo: '/7RNXnyiMbjgqtPAjja13wchcrGI.png' },
        { id: 80, name: 'Adult Swim', logo: '/tHZPHOLc6iF27G34cAZGPsMtMSy.png' },
        { id: 17, name: 'Toonami', logo: '/tHZPHOLc6iF27G34cAZGPsMtMSy.png' },
        { id: 83, name: 'Animax', logo: '/5S9xrNouNbaYlhDkaZopIpcmbp2.png' },
    ];
    container.innerHTML = animeNetworks.map(createNetworkItem).join('');
}

//Documentary Channels
async function displayDocumentaryNetworks() {
    const container = document.getElementById('documentary-network-container');
    const documentaryNetworks = [
        { id: 43, name: 'National Geographic', logo: '/q9rPBG1rHbUjII1Qn98VG2v7cFa.png' },
        { id: 64, name: 'Discovery Channel', logo: '/8qkdZlbrTSVfkJ73DjOBrwYtMSC.png' },
        { id: 65, name: 'History', logo: '/9fGgdJz17aBX7dOyfHJtsozB7bf.png' },
        { id: 332, name: 'BBC Two', logo: '/7HVPn1p2w1nC5oRKBehXVHpss7e.png' },
        { id: 100, name: 'BBC Four', logo: '/AgsOSxGvfxIonhPgrfkWCmsOKfA.png' },
        { id: 141, name: 'PBS America', logo: '/5GIF1QFJKwfIyTlAOnNyCzAE2nU.png' },
        { id: 121, name: 'Animal Planet', logo: '/xQ25rzpv83d74V1zpOzSHbYlwJq.png' },
        { id: 91, name: 'BBC Earth', logo: '/ynQq9VuQGFHxBO0gWEVM6DAuQDr.png' },
        { id: 85, name: 'Arte', logo: '/6UIpEURdjnmcJPwgTDRzVRuwADr.png' },
        { id: 151, name: 'Rai Storia', logo: '/7ypIuH80IDEZwScONIjrBqihXVU.png' },

    ];
    container.innerHTML = documentaryNetworks.map(createNetworkItem).join('');
}

//Arabic channels
async function displayArabicNetworks() {
    const container = document.getElementById('arabic-network-container');
    const arabicNetworks = [
        { id: 1660, name: 'MBC 1', logo: '/oG6DMW1SajkvYpbMAZ9m2LZURYx.png' },
        { id: 1661, name: 'MBC 2', logo: '/dTnrqi9U571MDkN5PQB1KW3em10.png' },
        { id: 1745, name: 'MBC 3', logo: '/chVBryjYBFhCx9BHpRyVoZnX9ch.png' },
        { id: 1662, name: 'MBC 4', logo: '/j6RmGEhE1V9MktLAgBilxUPVfAa.png' },
        { id: 1747, name: 'MBC Action', logo: '/1qVsMfwWB1t3y5cGnq3CltGyDVA.png' },
        { id: 1748, name: 'MBC Max', logo: '/qAJVIbtfXKwOuBz5n16zLwQBwcX.png' },
        { id: 1663, name: 'MBC Drama', logo: '/gayeSLMViJYLCjJD7XWA6Fvh64n.png' },
        { id: 355, name: 'Abu Dhabi TV', logo: '/fdVej2HKGaLhzJve9dI0EbNTIHC.png' },
        { id: 1728, name: 'Dubai TV', logo: '/diP9la1aSENKO7ygXNAaxbNHv1I.png' },
        { id: 1750, name: 'Rotana Cinema', logo: '/8sWQneuN1zR7P5nJAqvH34Hmi4O.png' },
        { id: 1751, name: 'Rotana Khalijia', logo: '/iynB9WxVpc1Tbean0wR1ufueI7r.png' },
        { id: 1020, name: 'Al Jazeera', logo: '/9i15HMPXjW657H4BnrMkeQcbktL.png' },
        { id: 1021, name: 'Al Arabiya', logo: '/fOYXRQbhHXQI3H9JtHGFJgR4xN3.png' },
        { id: 1752, name: 'CBC (Egypt)', logo: '/qe2RYSTCxbPh3jCaM1tk9E4uJZ6.png' },
        { id: 3657, name: 'DMC', logo: '/8fKQ88EOJ6qmgaoPsPJv3isN9VC.png' },
        { id: 1754, name: 'ON TV', logo: '/bMjDKMox1AgY8byELQIgrMdw4r9.png' },
        { id: 3626, name: 'Shahid', logo: '/X37sqYsNaok8iZXzJpvFbNSJHe.png' },
        { id: 1675, name: 'OSN', logo: '/d6D9pUDthmVYnmS7dmXj669l6Na.png' },
        { id: 1753, name: 'Al Nahar TV', logo: '/j2DofV0EVjP2TWC8aGqPAAcBsnD.png' }
    ];
    container.innerHTML = arabicNetworks.map(createNetworkItem).join('');
}

//Sports
async function displaySportsNetworks() {
    const container = document.getElementById('sports-network-container');
    const sportsNetworks = [
        { id: 582, name: 'NBC Sports', logo: '/42DK95aYJKNUHECYorwF9Y4pEWD.png' },
        { id: 19, name: 'FOX Sports', logo: '/1DSpHrWyOORkL9N2QHX7Adt31mQ.png' },
        { id: 16, name: 'CBS Sports', logo: '/nm8d7P7MJNiBLdgIzUK0gkuEA4r.png' },
        { id: 29, name: 'ESPN', logo: '/w9le4FUeXVlKLfnlkuk1djRrena.png' },
        { id: 265, name: 'Eurosport', logo: '/AfhbW2Y6X9uwoZAgoP0cOfSPoH7.png' },
        { id: 214, name: 'Sky Sports', logo: '/xeyAPBYArO8q60Z7UJcXf6WPXBX.png' },
        { id: 1079, name: 'TSN', logo: '/eEtN7vNV9ISMft8TYUVvWfq95OK.png' },
        { id: 380, name: 'BT Sport', logo: '/zi4UZ8ZU9iS41sxHnqDTS32ftGf.png' },
        { id: 845, name: 'beIN SPORTS', logo: '/aMedkd2lZud2h3j8C4KU7twzvjK.png' },
        { id: 2893, name: 'DAZN', logo: '/kGipWQCpZcafdYmF0NICQmKw0uQ.png' },
        { id: 226, name: 'Sportsnet', logo: '/e5EpXQONx9dHwohXfEurZJEZgqR.png' },
        { id: 1063, name: 'Movistar+', logo: '/tZSV7HC7DVgzXwDSkuu3PkW8C1w.png' },
        { id: 2771, name: 'Ziggo Sport', logo: '/1Bb3dz4RZG6ymUOfYcCBgGaaw3f.png' },
        { id: 3900, name: 'beIN', logo: '/v9Y2WONsq30n4V5DZvWCCh3SQRo.png' }
    ];
    container.innerHTML = sportsNetworks.map(createNetworkItem).join('');
}

function createNetworkItem(network) {
    return `
        <div class="network-item" data-id="${network.id}">
            <img src="${IMG_BASE_URL}${network.logo}" alt="${network.name}">
            <p>${network.name}</p>
        </div>
    `;
}
  

    async function showNetworkContent(networkId, networkName, page = 1) {
        const modal = document.getElementById('network-modal');
        const modalTitle = document.getElementById('network-modal-title');
        const modalContent = document.getElementById('network-modal-content');
        const paginationContainer = document.getElementById('network-modal-pagination');
    
        modalTitle.textContent = `${networkName} - أفلام ومسلسلات`;
        modalContent.innerHTML = '<p>جاري التحميل...</p>';
        modal.style.display = 'block';
    
        const data = await fetchData(`/discover/tv?with_networks=${networkId}&page=${page}`);
        if (data && data.results) {
            modalContent.innerHTML = data.results.map(createMovieCard).join('');
            
            // إضافة أزرار التنقل
            paginationContainer.innerHTML = `
                <button id="prev-page" ${page === 1 ? 'disabled' : ''}>الصفحة السابقة</button>
                <span>الصفحة ${page} من ${data.total_pages}</span>
                <button id="next-page" ${page === data.total_pages ? 'disabled' : ''}>الصفحة التالية</button>
            `;

            // إضافة مستمعي الأحداث لأزرار التنقل
            document.getElementById('prev-page').addEventListener('click', () => {
                if (page > 1) showNetworkContent(networkId, networkName, page - 1);
            });
            document.getElementById('next-page').addEventListener('click', () => {
                if (page < data.total_pages) showNetworkContent(networkId, networkName, page + 1);
            });
        } else {
            modalContent.innerHTML = '<p>عذرًا، لا يوجد محتوى متاح حاليًا.</p>';
            paginationContainer.innerHTML = '';
        }
    }


    //playliste Modal
    // Initialize watchlist in localStorage if it doesn't exist
    if (!localStorage.getItem('watchlist')) {
        localStorage.setItem('watchlist', JSON.stringify([]));
    }
    
    
    // Add event listener for the add-to-list buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-list') || 
            (e.target.parentElement && e.target.parentElement.classList.contains('add-to-list'))) {
            const movieCard = e.target.closest('.movie-card');
            const movieId = movieCard.dataset.id;
            const movieType = movieCard.dataset.type;
            
            // Convert type to match our tab data-types
            let watchlistType;
            if (movieType === 'movie') {
                watchlistType = 'movies';
            } else if (movieType === 'tv') {
                watchlistType = 'series';
            } else if (movieType === 'anime') {
                watchlistType = 'anime';
            }
            
            addToWatchlist(movieId, movieType, watchlistType);
        }
    });
    
    
    // Add event listener for My List link
    document.querySelector('a[href="#mylist"]').addEventListener('click', function(e) {
        e.preventDefault();
        showWatchlist();
    });
    
    
    // Handle watchlist tabs
    document.querySelectorAll('.playlist-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.playlist-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            displayWatchlistItems(this.dataset.type);
        });
    });
    
    // Handle rating filter
    document.getElementById('ratingFilter').addEventListener('change', function() {
        displayWatchlistItems(document.querySelector('.playlist-tab.active').dataset.type);
    });
    
    //add to watschlist
    async function addToWatchlist(id, apiType, watchlistType) {
        const watchlist = JSON.parse(localStorage.getItem('watchlist'));
        if (!watchlist.some(item => item.id === id)) {
            const itemData = await fetchData(`/${apiType}/${id}`);
            const watchlistItem = {
                id: id,
                type: watchlistType, // This will be 'movies', 'series', or 'anime'
                apiType: apiType,    // This will be 'movie' or 'tv' for API calls
                title: itemData.title || itemData.name,
                poster_path: itemData.poster_path,
                vote_average: itemData.vote_average
            };
            watchlist.push(watchlistItem);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            showNotification('تمت الإضافة إلى قائمة المشاهدة');
        }
    }
    
    
    function showWatchlist() {
        document.getElementById('playlistModal').style.display = 'block';
        displayWatchlistItems('all');
    }
    
    //display Watch list
    function displayWatchlistItems(filterType) {
        const watchlist = JSON.parse(localStorage.getItem('watchlist'));
        const ratingFilter = parseFloat(document.getElementById('ratingFilter').value);
        
        let filteredItems = watchlist;
        
        // Filter by type
        if (filterType !== 'all') {
            filteredItems = watchlist.filter(item => item.type === filterType);
        }
        
        // Filter by rating
        if (ratingFilter) {
            filteredItems = filteredItems.filter(item => item.vote_average >= ratingFilter);
        }
    
        const container = document.getElementById('playlistItems');
        
        if (filteredItems.length === 0) {
            container.innerHTML = '<div class="empty-message">لا توجد عناصر في هذه القائمة</div>';
            return;
        }
    
        container.innerHTML = filteredItems.map(item => `
            <div class="playlist-item" data-id="${item.id}" data-type="${item.apiType}">
                <img src="${IMG_BASE_URL}${item.poster_path}" alt="${item.title}">
                <div class="playlist-item-info">
                    <h3>${item.title}</h3>
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${item.vote_average.toFixed(1)}</span>
                    </div>
                </div>
                <button class="remove-from-list" onclick="removeFromWatchlist('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    
    function removeFromWatchlist(id) {
        let watchlist = JSON.parse(localStorage.getItem('watchlist'));
        watchlist = watchlist.filter(item => item.id !== id);
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        displayWatchlistItems(document.querySelector('.playlist-tab.active').dataset.type);
        showNotification('تم الحذف من قائمة المشاهدة');
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    // Close modal when clicking the close button or outside the modal
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('playlistModal').style.display = 'none';
    });
    
    

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('playlistModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    //Latest Trailers
    async function fetchMovies(category) {
        showLoading();
        const response = await fetch(`https://api.themoviedb.org/3/movie/${category}?api_key=${API_KEY}&language=ar`);
        const data = await response.json();
        hideLoading();
        return data.results;
    }

    async function fetchMovieTrailer(movieId) {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`);
        const data = await response.json();
        return data.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
    }

    function changeBgImage(imageUrl) {
        const newBg = document.createElement('div');
        newBg.classList.add('hero-bg1');
        newBg.style.backgroundImage = `url(${imageUrl})`;
        newBg.style.opacity = '0';
        document.querySelector('.hero1').appendChild(newBg);

        setTimeout(() => {
            newBg.style.opacity = '1';
            heroBg.style.opacity = '0';
        }, 50);

        setTimeout(() => {
            heroBg.remove();
            heroBg = newBg;
        }, 1050);
    }

    function createTrailerElement(movie) {
        const trailerElement = document.createElement('div');
        trailerElement.classList.add('trailer');
        trailerElement.innerHTML = `
            <img src="${baseImageUrl}${movie.backdrop_path}" alt="${movie.title}">
            <i class="fas fa-play"></i>
            <div class="border-circle"></div>
            <div class="trailer-title">${movie.title}</div>
        `;
        trailerElement.addEventListener('click', () => openTrailer(movie));
        return trailerElement;
    }

    async function openTrailer(movie) {
        showLoading();
        const trailer = await fetchMovieTrailer(movie.id);
        modalTitle.textContent = movie.title;
        if (trailer) {
            modalBody.innerHTML = `<iframe src="${baseVideoUrl}${trailer.key}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;
        } else {
            modalBody.innerHTML = '<p>عذرًا، لا يوجد مقطع دعائي متاح لهذا الفيلم.</p>';
        }
        modalOverview.textContent = movie.overview;
        modalDetails.innerHTML = `
            <span>تاريخ الإصدار: ${movie.release_date}</span>
            <span>التقييم: ${movie.vote_average}/10</span>
            <span>عدد الأصوات: ${movie.vote_count}</span>
        `;
        modal.style.display = 'block';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 50);
        hideLoading();
    }

    function closeModal() {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            modalBody.innerHTML = '';
        }, 300);
    }

    async function loadMovies(category) {
        showLoading();
        const movies = await fetchMovies(category);
        trailersContainer.innerHTML = '';
        movies.forEach(movie => {
            trailersContainer.appendChild(createTrailerElement(movie));
        });

        changeBgImage(`${baseImageUrl}${movies[0].backdrop_path}`);

        clearInterval(window.bgInterval);
        window.bgInterval = setInterval(() => {
            currentBgIndex = (currentBgIndex + 1) % movies.length;
            changeBgImage(`${baseImageUrl}${movies[currentBgIndex].backdrop_path}`);
        }, 7000);

        hideLoading();
    }

    function showLoading() {
        loading.style.display = 'flex';
    }

    function hideLoading() {
        loading.style.display = 'none';
    }

    categories.addEventListener('click', async (e) => {
        if (e.target.classList.contains('category')) {
            const category = e.target.dataset.category;
            document.querySelectorAll('.category').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            await loadMovies(category);
        }
    });

    loadMovies('upcoming');
   
    
    //event listeners
document.addEventListener('DOMContentLoaded', () => {
    displayMovies('/trending/all/week', 'trending-container');
    displayMovies('/movie/popular', 'popular-movies-container');
    displayMovies('/tv/top_rated', 'top-rated-series-container');
    displayGenres();
    displayNetworks();
    displayAnimeNetworks();
    displayDocumentaryNetworks();
    displayArabicNetworks();
    displaySportsNetworks();

    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', async (e) => {


        if (e.target.value.length > 2) {
            const results = await searchMovies(e.target.value);
            displaySearchResults(results);
        } else {
            searchResults.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {

    //networ-iteme
    if (e.target.closest('.network-item')) {
        const networkItem = e.target.closest('.network-item');
        const networkId = networkItem.dataset.id;
        const networkName = networkItem.querySelector('p').textContent;
        showNetworkContent(networkId, networkName);
    }

    if (e.target.classList.contains('close')) {
        document.getElementById('network-modal').style.display = 'none';
    }
    });
        
    
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('network-modal')) {
            document.getElementById('network-modal').style.display = 'none';
        }

    //movie-card
        if (e.target.closest('.movie-card') || e.target.closest('.search-result-item') || e.target.closest('.recommendation-item')) {
            const id = e.target.closest('[data-id]').dataset.id;
            const type = e.target.closest('[data-type]').dataset.type;
            showMovieDetails(id, type);
        }

        if (e.target.classList.contains('close')) {
            document.getElementById('movie-modal').style.display = 'none';
        }

        if (e.target.classList.contains('genre-tag')) {
            const genreId = e.target.dataset.id;
            displayMovies(`/discover/movie?with_genres=${genreId}`, 'trending-container');
        }

        if (e.target.closest('.network-item')) {
            const networkId = e.target.closest('.network-item').dataset.id;
            displayMovies(`/discover/tv?with_networks=${networkId}`, 'trending-container');
        }
    });

     // إغلاق المودال عند الضغط على زر الإغلاق

    window.addEventListener('click', (e) => {

        
        if (e.target === document.getElementById('movie-modal')) {
            document.getElementById('movie-modal').style.display = 'none';
        }
    });
});
