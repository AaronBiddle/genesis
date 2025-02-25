<script lang="ts">
    type WeatherData = {
        city: string;
        temperature: number;
        condition: string;
        icon: string;
    };
    
    const cities = [
        'New York',
        'London',
        'Tokyo',
        'Paris',
        'Sydney'
    ];
    
    // Mock weather data - in a real app, this would come from an API
    const weatherConditions = [
        { condition: 'Sunny', icon: '☀️' },
        { condition: 'Cloudy', icon: '☁️' },
        { condition: 'Rainy', icon: '🌧️' },
        { condition: 'Snowy', icon: '❄️' },
        { condition: 'Stormy', icon: '⛈️' }
    ];
    
    let selectedCity = cities[0];
    let weatherData: WeatherData | null = null;
    
    // Function to simulate getting weather data
    function fetchWeatherData() {
        // Simulate API call with random data
        const randomTemp = Math.floor(Math.random() * 35) - 5; // -5 to 30°C
        const randomCondition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
        
        weatherData = {
            city: selectedCity,
            temperature: randomTemp,
            condition: randomCondition.condition,
            icon: randomCondition.icon
        };
    }
    
    // Initial fetch
    fetchWeatherData();
</script>

<div class="p-4">
    <h2 class="text-xl font-bold mb-3">Weather App</h2>
    
    <div class="mb-4">
        <label for="city-select" class="block text-sm font-medium text-gray-700 mb-1">
            Select a city
        </label>
        <select
            id="city-select"
            bind:value={selectedCity}
            on:change={fetchWeatherData}
            class="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
        >
            {#each cities as city}
                <option value={city}>{city}</option>
            {/each}
        </select>
    </div>
    
    {#if weatherData}
        <div class="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-4 shadow-sm">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-lg font-semibold">{weatherData.city}</h3>
                    <div class="text-3xl font-bold my-2">{weatherData.temperature}°C</div>
                    <div class="text-gray-700">{weatherData.condition}</div>
                </div>
                <div class="text-5xl">{weatherData.icon}</div>
            </div>
        </div>
    {/if}
    
    <button 
        on:click={fetchWeatherData}
        class="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
    >
        Refresh Weather
    </button>
</div> 