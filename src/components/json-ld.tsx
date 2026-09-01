/**
 * Emits a JSON-LD block.
 *
 * `JSON.stringify` is the only thing that ever reaches the script tag, and the
 * object it serialises is built from validated content — so the one injection
 * risk left is a `</script>` sequence inside a string value, which the escape
 * below neutralises. React would escape this for a text node but not inside a
 * script element, which is exactly why it is done explicitly here.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      dangerouslySetInnerHTML={{ __html: json }}
      type="application/ld+json"
    />
  );
}
