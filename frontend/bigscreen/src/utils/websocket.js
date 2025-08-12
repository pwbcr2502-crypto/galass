import { ref } from 'vue'

// WebSocket 连接状态
const wsConnection = ref(null)
const isConnected = ref(false)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5
const reconnectInterval = ref(null)

// WebSocket URL
const getWebSocketUrl = () => {
  const wsUrl = import.meta.env.VUE_APP_WS_URL || 'ws://localhost:3000'
  return wsUrl.replace(/^http/, 'ws')
}

// 事件回调函数
let messageCallback = null
let connectCallback = null
let disconnectCallback = null
let errorCallback = null

/**
 * 连接 WebSocket
 * @param {Function} onMessage - 消息回调函数
 * @param {Function} onConnect - 连接成功回调函数
 * @param {Function} onDisconnect - 断开连接回调函数
 * @param {Function} onError - 错误回调函数
 */
export const useWebSocket = () => {
  
  const connect = (onMessage, onConnect, onDisconnect, onError) => {
    // 保存回调函数
    messageCallback = onMessage
    connectCallback = onConnect
    disconnectCallback = onDisconnect
    errorCallback = onError

    // 如果已经连接，直接返回
    if (wsConnection.value && wsConnection.value.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    try {
      const wsUrl = getWebSocketUrl()
      console.log('Connecting to WebSocket:', wsUrl)
      
      wsConnection.value = new WebSocket(wsUrl)

      // 连接成功
      wsConnection.value.onopen = (event) => {
        console.log('WebSocket connected:', event)
        isConnected.value = true
        reconnectAttempts.value = 0
        
        // 清除重连定时器
        if (reconnectInterval.value) {
          clearInterval(reconnectInterval.value)
          reconnectInterval.value = null
        }

        // 发送连接确认消息
        send({
          type: 'connection',
          clientType: 'bigscreen',
          timestamp: Date.now()
        })

        if (connectCallback) {
          connectCallback(event)
        }
      }

      // 接收消息
      wsConnection.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket message received:', data)
          
          if (messageCallback) {
            messageCallback(data)
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, event.data)
        }
      }

      // 连接关闭
      wsConnection.value.onclose = (event) => {
        console.log('WebSocket disconnected:', event)
        isConnected.value = false
        
        if (disconnectCallback) {
          disconnectCallback(event)
        }

        // 自动重连
        if (reconnectAttempts.value < maxReconnectAttempts) {
          scheduleReconnect()
        } else {
          console.error('Max reconnection attempts reached')
        }
      }

      // 连接错误
      wsConnection.value.onerror = (event) => {
        console.error('WebSocket error:', event)
        isConnected.value = false
        
        if (errorCallback) {
          errorCallback(event)
        }
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  // 断开连接
  const disconnect = () => {
    if (reconnectInterval.value) {
      clearInterval(reconnectInterval.value)
      reconnectInterval.value = null
    }

    if (wsConnection.value) {
      wsConnection.value.close(1000, 'Client disconnect')
      wsConnection.value = null
    }
    
    isConnected.value = false
    reconnectAttempts.value = 0
  }

  // 发送消息
  const send = (message) => {
    if (wsConnection.value && wsConnection.value.readyState === WebSocket.OPEN) {
      try {
        const jsonMessage = JSON.stringify(message)
        wsConnection.value.send(jsonMessage)
        console.log('WebSocket message sent:', message)
        return true
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
        return false
      }
    } else {
      console.warn('WebSocket is not connected, message not sent:', message)
      return false
    }
  }

  // 计划重连
  const scheduleReconnect = () => {
    if (reconnectInterval.value) {
      return
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000) // 指数退避，最大30秒
    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.value + 1})`)

    reconnectInterval.value = setTimeout(() => {
      reconnectAttempts.value++
      reconnectInterval.value = null
      connect(messageCallback, connectCallback, disconnectCallback, errorCallback)
    }, delay)
  }

  // 获取连接状态
  const getConnectionStatus = () => {
    return {
      isConnected: isConnected.value,
      readyState: wsConnection.value?.readyState,
      reconnectAttempts: reconnectAttempts.value
    }
  }

  return {
    connect,
    disconnect,
    send,
    isConnected,
    getConnectionStatus
  }
}

// 大屏专用的 WebSocket Hook
export const useBigScreenWebSocket = () => {
  const { connect, disconnect, send, isConnected } = useWebSocket()

  // 大屏特定的连接方法
  const connectBigScreen = (onVoteUpdate, onSystemUpdate) => {
    connect(
      // 消息处理
      (data) => {
        switch (data.type) {
          case 'vote_update':
            if (onVoteUpdate) onVoteUpdate(data)
            break
          case 'system_update':
            if (onSystemUpdate) onSystemUpdate(data)
            break
          case 'heartbeat':
            // 心跳响应
            send({ type: 'heartbeat_response', timestamp: Date.now() })
            break
          default:
            console.log('Unknown message type:', data.type)
        }
      },
      // 连接成功
      () => {
        console.log('Big screen WebSocket connected')
        // 注册为大屏客户端
        send({
          type: 'register',
          clientType: 'bigscreen',
          timestamp: Date.now()
        })
      },
      // 断开连接
      () => {
        console.log('Big screen WebSocket disconnected')
      },
      // 错误处理
      (error) => {
        console.error('Big screen WebSocket error:', error)
      }
    )
  }

  // 请求实时数据
  const requestRealTimeData = () => {
    return send({
      type: 'request_realtime_data',
      timestamp: Date.now()
    })
  }

  // 订阅特定事件
  const subscribe = (eventTypes = []) => {
    return send({
      type: 'subscribe',
      events: eventTypes,
      timestamp: Date.now()
    })
  }

  // 取消订阅
  const unsubscribe = (eventTypes = []) => {
    return send({
      type: 'unsubscribe',
      events: eventTypes,
      timestamp: Date.now()
    })
  }

  return {
    connectBigScreen,
    disconnect,
    requestRealTimeData,
    subscribe,
    unsubscribe,
    isConnected
  }
}

export default {
  useWebSocket,
  useBigScreenWebSocket
}