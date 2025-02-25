<script lang="ts">
    let count = 0;

    function increment() {
        count += 1;
    }

    function decrement() {
        count -= 1;
    }
</script>

<div class="p-4 flex flex-col items-center">
    <h2 class="text-xl font-bold mb-4">Counter</h2>
    
    <div class="flex items-center justify-center space-x-4 mb-4">
        <button 
            on:click={decrement}
            class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            aria-label="Decrement"
        >
            -
        </button>
        
        <span class="text-2xl font-semibold">{count}</span>
        
        <button 
            on:click={increment}
            class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            aria-label="Increment"
        >
            +
        </button>
    </div>

    <p class="text-gray-600">Click the buttons to update the counter value.</p>
</div> 