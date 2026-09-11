/**
 * Last resort: the root layout itself failed, so there is no shell, no fonts
 * and no tokens. Everything here is inline on purpose.
 */
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem 1.5rem',
          background: '#faf7f2',
          color: '#1a1714',
          font: '15px/1.5 ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <main style={{ maxWidth: '26rem' }}>
          <div style={{ height: 2, background: '#b4451f', width: '2.5rem', marginBottom: '2rem' }} />
          <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '2rem', lineHeight: 1.15 }}>
            Something went wrong
          </h1>
          <p style={{ margin: '0.75rem 0 0', color: '#5b5247' }}>
            The page could not be loaded. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.75rem',
              padding: '0 1.25rem',
              height: '2.75rem',
              border: 0,
              borderRadius: 5,
              background: '#b4451f',
              color: '#fdfbf8',
              font: 'inherit',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ marginTop: '1.5rem', fontSize: '0.6875rem', color: '#7c7162' }}>
              Reference {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
