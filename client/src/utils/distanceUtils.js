
/**
 * Calculates the distance between the store (fixed origin) and the provided zip code.
 * Uses a Cloudflare Worker proxy to handle Google Maps API calls and caching.
 * 
 * @param {string} zipCode - The destination zip code.
 * @returns {Promise<object>} - The distance matrix response (or error).
 */
export const calculateDistance = async (zipCode) => {
    // TODO: Replace with your actual deployed Worker URL
    const WORKER_URL = 'https://your-worker-name.your-subdomain.workers.dev';

    try {
        const response = await fetch(`${WORKER_URL}?zip=${zipCode}`);

        if (!response.ok) {
            throw new Error(`Error fetching distance: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to calculate distance:", error);
        throw error;
    }
};
