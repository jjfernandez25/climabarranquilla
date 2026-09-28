async function buscarCiudad() {

    const input = document.getElementById("ciudadInput");
    const ciudad = input.value.trim();

    if (!ciudad) {
        alert("Escribe una ciudad.");
        return;
    }

    const resultado = document.getElementById("resultado");

    resultado.innerHTML = `
        <h2>Buscando...</h2>
        <p>Consultando información meteorológica...</p>
    `;

    try {

        // Buscar la ciudad
        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ciudad)}&count=1&language=es&format=json`
        );

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {

            resultado.innerHTML = `
                <h2>Ciudad no encontrada ❌</h2>
                <p>Intenta con otro nombre.</p>
            `;

            return;
        }

        const lugar = geoData.results[0];

        const latitud = lugar.latitude;
        const longitud = lugar.longitude;

        // Obtener el clima
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitud}&longitude=${longitud}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`
        );

        const weatherData = await weatherResponse.json();

        const clima = weatherData.current;

        // Mostrar resultado
        resultado.innerHTML = `
            <h2>${lugar.name}, ${lugar.country}</h2>

            <div class="temperatura">
                ${clima.temperature_2m}°C
            </div>

            <p class="dato">
                💧 Humedad: ${clima.relative_humidity_2m}%
            </p>

            <p class="dato">
                💨 Viento: ${clima.wind_speed_10m} km/h
            </p>

            <button onclick="guardarFavorito(
                '${lugar.name}',
                ${latitud},
                ${longitud}
            )">
                ⭐ Guardar como favorita
            </button>
        `;

    } catch (error) {

        console.error(error);

        resultado.innerHTML = `
            <h2>Error ❌</h2>
            <p>No se pudo obtener la información del clima.</p>
        `;
    }
}


// Guardar ciudad en Supabase
async function guardarFavorito(ciudad, latitud, longitud) {

    const { error } = await window.supabase
        .from("favoritos")
        .insert([
            {
                ciudad: ciudad,
                latitud: latitud,
                longitud: longitud
            }
        ]);

    if (error) {

        console.error(error);

        alert("No se pudo guardar la ciudad.");

        return;
    }

    alert(`⭐ ${ciudad} fue guardada como favorita.`);

    cargarFavoritos();
}


// Cargar ciudades favoritas
async function cargarFavoritos() {

    const lista = document.getElementById("listaFavoritos");

    const { data, error } = await window.supabase
        .from("favoritos")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        lista.innerHTML = `
            <p>No se pudieron cargar las ciudades.</p>
        `;

        return;
    }

    if (!data || data.length === 0) {

        lista.innerHTML = `
            <p>No tienes ciudades favoritas todavía.</p>
        `;

        return;
    }

    lista.innerHTML = data.map(favorito => `
        <div class="favorito">

            <strong>
                ⭐ ${favorito.ciudad}
            </strong>

        </div>
    `).join("");
}


// Cargar favoritos cuando abre la página
document.addEventListener(
    "DOMContentLoaded",
    cargarFavoritos
);
