import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * usePyodide — React hook สำหรับจัดการ Pyodide Web Worker
 * รัน Python code จริงในเบราว์เซอร์ผ่าน WebAssembly
 */
export default function usePyodide() {
    const [status, setStatus] = useState('idle'); // idle | loading | ready | running | error
    const workerRef = useRef(null);
    const resolveRef = useRef(null);
    const outputRef = useRef([]);
    const onOutputRef = useRef(null);

    // Initialize worker
    useEffect(() => {
        const worker = new Worker('/pyodideWorker.js');
        workerRef.current = worker;

        worker.onmessage = (e) => {
            const { type, text, status: s, error, success, fsChanges } = e.data;

            switch (type) {
                case 'status':
                    setStatus(s);
                    if (s === 'loading') {
                        outputRef.current.push({ type: 'system', text: '⏳ Loading Python runtime (first time may take a few seconds)...' });
                        onOutputRef.current?.([...outputRef.current]);
                    }
                    if (s === 'ready') {
                        outputRef.current.push({ type: 'system', text: '✅ Python 3.12 ready!' });
                        onOutputRef.current?.([...outputRef.current]);
                    }
                    break;

                case 'stdout':
                    outputRef.current.push({ type: 'stdout', text });
                    onOutputRef.current?.([...outputRef.current]);
                    break;

                case 'stderr':
                    outputRef.current.push({ type: 'stderr', text });
                    onOutputRef.current?.([...outputRef.current]);
                    break;

                case 'run_start':
                    setStatus('running');
                    break;

                case 'result':
                    setStatus('ready');
                    if (resolveRef.current) {
                        resolveRef.current({ success, fsChanges: fsChanges || null, error });
                    }
                    resolveRef.current = null;
                    break;

                case 'error':
                    setStatus('error');
                    outputRef.current.push({ type: 'stderr', text: error });
                    onOutputRef.current?.([...outputRef.current]);
                    break;
            }
        };

        // Auto-init
        worker.postMessage({ type: 'init' });
        setStatus('loading');

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []);

    /**
     * รัน Python code
     * @param {string} code — Python code to execute
     * @param {Array} files — game files in the current folder [{name, type, content}]
     * @returns {Promise<{success, fsChanges, error}>}
     */
    const runCode = useCallback((code, files = []) => {
        return new Promise((resolve) => {
            if (!workerRef.current) {
                resolve({ success: false, error: 'Worker not ready' });
                return;
            }

            // Add run header to output
            outputRef.current.push({ type: 'command', text: `>>> Running...` });
            onOutputRef.current?.([...outputRef.current]);

            resolveRef.current = resolve;

            // Timeout after 15 seconds
            const timeout = setTimeout(() => {
                if (resolveRef.current) {
                    outputRef.current.push({ type: 'stderr', text: '⏰ Execution timed out (15s limit)' });
                    onOutputRef.current?.([...outputRef.current]);
                    resolveRef.current({ success: false, error: 'Timeout' });
                    resolveRef.current = null;
                    setStatus('ready');
                    // Recreate worker on timeout
                    workerRef.current?.terminate();
                    const newWorker = new Worker('/pyodideWorker.js');
                    workerRef.current = newWorker;
                    newWorker.onmessage = workerRef.current?.onmessage;
                    newWorker.postMessage({ type: 'init' });
                }
            }, 15000);

            // Override resolve to also clear timeout
            const originalResolve = resolve;
            resolveRef.current = (result) => {
                clearTimeout(timeout);
                originalResolve(result);
            };

            workerRef.current.postMessage({
                type: 'run',
                payload: { code, files }
            });
        });
    }, []);

    const clearOutput = useCallback(() => {
        outputRef.current = [{ type: 'system', text: 'Python 3.12 (Pyodide WebAssembly)' }];
        onOutputRef.current?.([...outputRef.current]);
    }, []);

    const setOnOutput = useCallback((fn) => {
        onOutputRef.current = fn;
    }, []);

    return {
        status,
        runCode,
        clearOutput,
        setOnOutput,
        output: outputRef.current
    };
}
