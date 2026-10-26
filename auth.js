// RSA password encryption for the A1 login flow.
//
// A1 auth is a two-step handshake:
//   1. GET /Auth/Session              -> { "Alg": "RSA", "Key": "<base64 SPKI>" }
//   2. POST /Auth/Session             -> { "Name": user, "Password": RSA(password) }
//      -> { "Access": "<jwt>", "Refresh": "<jwt>" }
//
// The public key arrives as the raw base64 of a SubjectPublicKeyInfo (SPKI)
// DER blob (the PKCS#8/X.509 body emitted by `MIGfMA0...DAQAB`, i.e. a
// 1024-bit RSA key). Node's crypto accepts the SPKI DER directly when wrapped
// as an SPKI PEM, or the base64 bits can be assembled into a PEM by adding
// the standard "BEGIN PUBLIC KEY" armor. The password is then encrypted with
// RSA PKCS#1 v1.5 (the scheme the A1 server uses; OAEP would not decode).
import crypto from "node:crypto";
export class A1AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = "A1AuthError";
    }
}
/**
 * Build a PEM string from a raw base64 SPKI public key (no armor, as A1
 * returns it). Handles both the bare-base64 form and an already-PEM'd form.
 */
export function spkiBase64ToPem(key) {
    const raw = key.trim();
    // Already armored.
    if (raw.includes("BEGIN"))
        return raw;
    // Normalize base64 (allow line breaks that might have been wrapped).
    const cleaned = raw.replace(/\s+/g, "");
    const body = cleaned.match(/.{1,64}/g)?.join("\n") ?? cleaned;
    return ("-----BEGIN PUBLIC KEY-----\n" +
        body +
        "\n-----END PUBLIC KEY-----");
}
/**
 * RSA-encrypt (PKCS#1 v1.5) `plaintext` with the given SPKI public key and
 * return base64 ciphertext — the format A1 expects in the Password field.
 */
export function rsaEncryptPassword(publicKey, plaintext) {
    let pem;
    try {
        pem = spkiBase64ToPem(publicKey);
    }
    catch {
        throw new A1AuthError("Failed to normalize A1 public key");
    }
    let encrypted;
    try {
        encrypted = crypto.publicEncrypt({
            key: pem,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        }, Buffer.from(plaintext, "utf8"));
    }
    catch (err) {
        // Retry once with OAEP if the server happens to use it (both are in the
        // wild; the doc's example ciphertext length hints at PKCS#1 v1.5 but we
        // hedge so a misread doesn't brick login).
        try {
            encrypted = crypto.publicEncrypt({
                key: pem,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha1",
            }, Buffer.from(plaintext, "utf8"));
        }
        catch (err2) {
            throw new A1AuthError(`RSA encryption failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    return encrypted.toString("base64");
}
//# sourceMappingURL=auth.js.map