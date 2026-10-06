import React, { useEffect } from 'react';
import { useSandpack } from '@codesandbox/sandpack-react';

export default function SandpackErrorMonitor({ onErrorChange }) {
  const { sandpack } = useSandpack();
  const error = sandpack.error;

  useEffect(() => {
    if (error) {
      const message = error.message || '';
      
      const isNetworkError =
        message.includes('Failed to fetch') ||
        message.includes('csb.csbops.io') ||
        message.includes('Error connection time out') ||
        message.includes('Net error');

      if (isNetworkError) {
        onErrorChange(false);
        return;
      }
      
      onErrorChange(true);
    } else {
      onErrorChange(false);
    }
  }, [error, onErrorChange]);

  return null;
}