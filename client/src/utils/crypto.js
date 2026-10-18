/**
 * Hashes a plaintext password using the browser's native Web Crypto API (SHA-256).
 * No external library needed — crypto.subtle is built into every modern browser.
 *
 * The resulting hex string is sent to the server instead of the raw password,
 * so the plaintext never travels over the network.
 *
 * @param {string} plaintext - The raw password typed by the user
 * @returns {Promise<string>} - A 64-character lowercase hex SHA-256 hash
 */
export async function hashPassword(plaintext) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
