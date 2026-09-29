import { useCallback, useEffect, useRef, useState } from 'react'

const TAB_ID = crypto.randomUUID()

interface ClaimMessage {
  type: 'claim'
  tabId: string
}

/**
 * Очередь уведомлений GREEN-API одна на инстанс: если читать её из нескольких вкладок,
 * сообщения разойдутся между ними. Поэтому активной остаётся только последняя открытая
 * вкладка, остальные переходят в режим ожидания.
 */
export function useExclusiveTab(channelName: string) {
  const [isActive, setIsActive] = useState(true)
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const channel = new BroadcastChannel(channelName)
    channelRef.current = channel

    channel.onmessage = (event: MessageEvent<ClaimMessage>) => {
      if (event.data.type === 'claim' && event.data.tabId !== TAB_ID) setIsActive(false)
    }
    channel.postMessage({ type: 'claim', tabId: TAB_ID } satisfies ClaimMessage)

    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [channelName])

  const activate = useCallback(() => {
    channelRef.current?.postMessage({ type: 'claim', tabId: TAB_ID } satisfies ClaimMessage)
    setIsActive(true)
  }, [])

  return { isActive, activate }
}
