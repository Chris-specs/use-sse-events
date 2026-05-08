'use client'

import { useEffect, useRef, useState } from 'react'

export interface SSEOptions {
    url: string
    onMessage?: (event: MessageEvent) => void
    onNotification?: (event: MessageEvent) => void
    onConnected?: (event: MessageEvent) => void
    onHeartbeat?: (event: MessageEvent) => void
    onReconnecting?: (info: { delay: number }) => void
    onError?: (error: Event) => void
    onOpen?: () => void
    customEvents?: Record<string, (event: MessageEvent) => void>
    enabled?: boolean
    reconnectInterval?: number
    withCredentials?: boolean
}

export function useSSE({
    url,
    enabled = true,
    reconnectInterval = 30000,
    withCredentials = true,
    onMessage,
    onNotification,
    onConnected,
    onHeartbeat,
    onReconnecting,
    onError,
    onOpen,
    customEvents
}: SSEOptions) {
    const [isConnected, setIsConnected] = useState(false)
    const eventSourceRef = useRef<EventSource | null>(null)

    // Use useCallback to stabilize the callback references
    const callbacksRef = useRef({
        onMessage,
        onNotification,
        onConnected,
        onHeartbeat,
        onReconnecting,
        onError,
        onOpen,
        customEvents
    })

    // Update the callback references when they change
    useEffect(() => {
        callbacksRef.current = {
            onMessage,
            onNotification,
            onConnected,
            onHeartbeat,
            onReconnecting,
            onError,
            onOpen,
            customEvents
        }
    }, [
        onMessage,
        onNotification,
        onConnected,
        onHeartbeat,
        onReconnecting,
        onError,
        onOpen,
        customEvents
    ])

    useEffect(() => {
        if (typeof window === 'undefined' || !enabled || !url) {
            return
        }

        let reconnectTimeout: ReturnType<typeof setTimeout>
        const events: {
            name: string
            handler: (e: MessageEvent) => void
        }[] = []

        const connect = () => {
            try {
                // Close previous connection if it exists
                if (eventSourceRef.current) {
                    eventSourceRef.current.close()
                    eventSourceRef.current = null
                }

                const eventSource = new EventSource(url, {
                    withCredentials
                })

                function addEvent(
                    name: string,
                    handler: (e: MessageEvent) => void
                ) {
                    eventSource.addEventListener(name, handler)
                    events.push({ name, handler })
                }

                eventSource.onopen = () => {
                    setIsConnected(true)
                    callbacksRef.current.onOpen?.()
                }

                eventSource.onmessage = (event) => {
                    callbacksRef.current.onMessage?.(event)
                }

                addEvent('connected', (event) => {
                    callbacksRef.current.onConnected?.(event)
                })

                addEvent('notification', (event) => {
                    callbacksRef.current.onNotification?.(event)
                })

                addEvent('heartbeat', (event) => {
                    callbacksRef.current.onHeartbeat?.(event)
                })

                // Custom events registration
                if (customEvents) {
                    Object.keys(customEvents).forEach((name) => {
                        addEvent(name, (e) => {
                            callbacksRef.current.customEvents?.[name]?.(e)
                        })
                    })
                }

                eventSource.onerror = (error) => {
                    setIsConnected(false)
                    callbacksRef.current.onError?.(error)

                    // Schedule reconnection
                    if (enabled) {
                        callbacksRef.current.onReconnecting?.({
                            delay: reconnectInterval
                        })
                        reconnectTimeout = setTimeout(() => {
                            connect()
                        }, reconnectInterval)
                    }
                }

                eventSourceRef.current = eventSource
            } catch (error) {
                console.error('Error creating SSE connection:', error)
                setIsConnected(false)
            }
        }

        connect()

        // Cleanup when component unmounts or dependencies change
        return () => {
            if (eventSourceRef.current) {
                events.forEach(({ name, handler }) => {
                    eventSourceRef.current?.removeEventListener(name, handler)
                })
                eventSourceRef.current.close()
                eventSourceRef.current = null
            }
            clearTimeout(reconnectTimeout)
            setIsConnected(false)
        }
    }, [url, enabled, withCredentials, reconnectInterval, customEvents]) // Only primitive dependencies

    return { isConnected }
}
