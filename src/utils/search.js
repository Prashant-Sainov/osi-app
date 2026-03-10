export function generateSearchGrams(name = "", badge = "", mobile = "", rank = "") {
    const input = `${name} ${badge} ${mobile} ${rank}`.toLowerCase().trim();
    const words = input.split(/[\s-]+/).filter(w => w.length > 0);
    const grams = new Set();

    words.forEach(word => {
        // Generate prefixes (edge n-grams) for each word
        // e.g., "amit" -> ["a", "am", "ami", "amit"]
        for (let i = 1; i <= word.length; i++) {
            grams.add(word.substring(0, i));
        }
    });

    // Also index whole words for exact matches
    words.forEach(word => grams.add(word));

    return Array.from(grams);
}
