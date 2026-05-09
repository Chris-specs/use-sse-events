import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSSE } from '../src/use-sse'

describe('useSSE', () => {
    const mockEventSourceInstance = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        close: vi.fn(),
        onopen: null,
        onmessage: null,
        onerror: null
    }

    const MockEventSource = vi.fn().mockImplementation(function () {
        return mockEventSourceInstance
    })

    beforeEach(() => {
        vi.stubGlobal('EventSource', MockEventSource)
        vi.clearAllMocks()
    })

    it('should create an EventSource instance with correct URL and credentials', () => {
        const testUrl = 'http://example.com'

        renderHook(() =>
            useSSE({
                url: testUrl,
                withCredentials: true
            })
        )

        expect(MockEventSource).toHaveBeenCalledWith(testUrl, {
            withCredentials: true
        })
    })

    it('should NOT create an EventSource instance if enabled is false', () => {
        renderHook(() =>
            useSSE({
                url: 'http://test.com',
                enabled: false
            })
        )

        expect(MockEventSource).not.toHaveBeenCalled()
    })

    it('should update isConnected to true when connection opens', () => {
        const { result } = renderHook(() => useSSE({ url: 'http://test.com' }))

        expect(result.current.isConnected).toBe(false)

        const instance = MockEventSource.mock.results[0].value

        act(() => {
            instance.onopen?.(new Event('open'))
        })

        expect(result.current.isConnected).toBe(true)
    })

    it('should call onMessage when a message is received', () => {
        const onMessage = vi.fn()
        renderHook(() =>
            useSSE({
                url: 'http://test.com',
                onMessage
            })
        )

        const instance = MockEventSource.mock.results[0].value
        const mockEvent = new MessageEvent('message', { data: 'hello' })

        act(() => {
            instance.onmessage?.(mockEvent)
        })

        expect(onMessage).toHaveBeenCalledWith(mockEvent)
    })

    it('should register and trigger custom events correctly', () => {
        const onStockUpdate = vi.fn()

        renderHook(() =>
            useSSE({
                url: 'http://test.com',
                customEvents: {
                    'update-stock': onStockUpdate
                }
            })
        )

        const instance = MockEventSource.mock.results[0].value

        expect(instance.addEventListener).toHaveBeenCalledWith(
            'update-stock',
            expect.any(Function)
        )

        const stockCall = instance.addEventListener.mock.calls.find(
            (call: [string, (event: MessageEvent) => void]) =>
                call[0] === 'update-stock'
        )
        const handler = stockCall[1]

        const mockEvent = new MessageEvent('update-stock', {
            data: '{"price": 100}'
        })

        act(() => {
            handler(mockEvent)
        })

        expect(onStockUpdate).toHaveBeenCalledWith(mockEvent)
    })

    it('should attempt to reconnect after an error occurred', () => {
        vi.useFakeTimers()

        const onReconnecting = vi.fn()
        const reconnectInterval = 5000

        renderHook(() =>
            useSSE({
                url: 'http://test.com',
                reconnectInterval,
                onReconnecting
            })
        )

        const instance = MockEventSource.mock.results[0].value

        act(() => {
            instance.onerror?.(new Event('error'))
        })

        expect(onReconnecting).toHaveBeenCalledWith({
            delay: reconnectInterval
        })

        expect(MockEventSource).toHaveBeenCalledTimes(1)

        act(() => {
            vi.advanceTimersByTime(reconnectInterval)
        })

        expect(MockEventSource).toHaveBeenCalledTimes(2)

        vi.useRealTimers()
    })

    it('should remove all event listeners and close connection on unmount', () => {
        const { unmount } = renderHook(() =>
            useSSE({
                url: 'http://test.com',
                customEvents: {
                    'update-stock': vi.fn()
                }
            })
        )

        const instance = MockEventSource.mock.results[0].value

        unmount()

        expect(instance.close).toHaveBeenCalled()

        expect(instance.removeEventListener).toHaveBeenCalledWith(
            'connected',
            expect.any(Function)
        )
        expect(instance.removeEventListener).toHaveBeenCalledWith(
            'notification',
            expect.any(Function)
        )
        expect(instance.removeEventListener).toHaveBeenCalledWith(
            'heartbeat',
            expect.any(Function)
        )

        expect(instance.removeEventListener).toHaveBeenCalledWith(
            'update-stock',
            expect.any(Function)
        )
    })
})
