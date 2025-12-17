export default {
    async fetch(request, env, ctx) {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const destinationZip = url.searchParams.get('zip');

        if (!destinationZip) {
            return new Response(JSON.stringify({ error: 'Zip code required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const ORIGIN_ZIP = '11420';
        const CACHE_KEY = `dist_v2:${ORIGIN_ZIP}:${destinationZip}`;

        try {
            // 1. Check Upstash Redis
            const redisUrl = `${env.UPSTASH_REDIS_REST_URL}/get/${CACHE_KEY}`;
            const redisResponse = await fetch(redisUrl, {
                headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}` },
            });

            const redisData = await redisResponse.json();

            if (redisData.result) {
                return new Response(redisData.result, {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
                });
            }

            // 2. Cache Miss - Call Google Maps
            const originString = encodeURIComponent(`${ORIGIN_ZIP}, Ciudad de México, México`);
            const destString = encodeURIComponent(`${destinationZip}, Ciudad de México, México`);
            const googleUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originString}&destinations=${destString}&key=${env.GOOGLE_MAPS_API_KEY}`;
            const googleResponse = await fetch(googleUrl);
            const googleData = await googleResponse.json();

            if (googleData.status !== 'OK') {
                throw new Error('Google Maps API Error: ' + googleData.status);
            }

            // Extract relevant data (distance text and value)
            // Simplified for this example, you might want to extract more specific fields
            const resultString = JSON.stringify(googleData);

            // 3. Save to Upstash Redis
            const setUrl = `${env.UPSTASH_REDIS_REST_URL}/set/${CACHE_KEY}`;
            await fetch(setUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: resultString // Body is the value to store
            });

            return new Response(resultString, {
                headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
    },
};
