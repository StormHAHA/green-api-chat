export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type InstanceState =
  'authorized' | 'notAuthorized' | 'blocked' | 'suspended' | 'starting' | 'pendingPassword'

export interface StateInstanceResponse {
  stateInstance: InstanceState
}

export interface SendMessageRequest {
  chatId: string
  message: string
}

export interface SendMessageResponse {
  idMessage: string
}

export interface CheckAccountResponse {
  exist: boolean
  chatId?: string
  username?: string
  phoneNumber?: number
}

export interface SenderData {
  chatId: string
  chatName?: string
  chatType?: string
  sender?: string
  senderName?: string
  senderContactName?: string
  senderPhoneNumber?: number
}

export interface MessageData {
  typeMessage: string
  textMessageData?: {
    textMessage: string
  }
  extendedTextMessageData?: {
    text: string
  }
}

export interface MessageWebhook {
  typeWebhook: 'incomingMessageReceived' | 'outgoingMessageReceived' | 'outgoingAPIMessageReceived'
  timestamp: number
  idMessage: string
  senderData: SenderData
  messageData: MessageData
}

export interface OtherWebhook {
  typeWebhook: string
  timestamp?: number
}

export type NotificationBody = MessageWebhook | OtherWebhook

export interface ReceivedNotification {
  receiptId: number
  body: NotificationBody
}

export interface DeleteNotificationResponse {
  result: boolean
  reason?: string
}
