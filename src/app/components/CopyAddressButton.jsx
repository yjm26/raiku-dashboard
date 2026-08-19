import { useState } from 'react';
import { formatAddress } from '../data.js';

export default function CopyAddressButton({ value }) {
  const [status, setStatus] = useState('idle');

  async function handleCopy() {
    const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
    if (clipboard && typeof clipboard.writeText === 'function') {
      try {
        await clipboard.writeText(value);
        setStatus('copied');
        return;
      } catch {
        // A denied clipboard permission should still leave the address usable.
      }
    }

    setStatus('unavailable');
  }

  const statusMessage = status === 'copied'
    ? 'Address copied'
    : status === 'unavailable'
      ? 'Copy unavailable — select the address manually.'
      : null;

  return (
    <span className="copy-address">
      <code className="copy-address__value" title={value}>{formatAddress(value)}</code>
      <button
        className="copy-address__button"
        type="button"
        onClick={handleCopy}
        aria-label={`Copy token address ${value}`}
      >
        <span aria-hidden="true">{status === 'copied' ? '✓' : '⧉'}</span>
        <span>{status === 'copied' ? 'Copied' : 'Copy'}</span>
      </button>
      {statusMessage ? (
        <span className="copy-address__status" role="status">{statusMessage}</span>
      ) : null}
    </span>
  );
}
