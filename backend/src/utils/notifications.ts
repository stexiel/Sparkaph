import prisma from "./prisma";
import { io } from "../app";

export enum NotificationType {
  FOLLOW = "FOLLOW",
  UNFOLLOW = "UNFOLLOW",
  FRIEND_REQUEST = "FRIEND_REQUEST",
  FRIEND_ACCEPTED = "FRIEND_ACCEPTED",
  MESSAGE = "MESSAGE",
  MENTION = "MENTION",
  APP_CREATED = "APP_CREATED",
  APP_DEPLOYED = "APP_DEPLOYED",
  APP_FAILED = "APP_FAILED",
  STORY_VIEW = "STORY_VIEW",
  COMMENT = "COMMENT",
  LIKE = "LIKE",
  SYSTEM = "SYSTEM",
}

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  fromUserId?: string;
  metadata?: Record<string, any>;
}

/**
 * Создает уведомление и отправляет через Socket.io
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  fromUserId,
  metadata,
}: CreateNotificationParams) {
  try {
    // Создаем уведомление в БД
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        fromUserId,
        isRead: false,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    // Отправляем через Socket.io в реальном времени
    io.to(userId).emit("notification", {
      ...notification,
      metadata,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Отправляет уведомление о новом подписчике
 */
export async function notifyNewFollower(followerId: string, userId: string) {
  const follower = await prisma.user.findUnique({
    where: { id: followerId },
    select: { username: true, nickname: true },
  });

  if (!follower) return;

  const displayName = follower.nickname || follower.username;

  await createNotification({
    userId,
    type: NotificationType.FOLLOW,
    title: "Новый подписчик",
    message: `${displayName} подписался на вас`,
    fromUserId: followerId,
  });
}

/**
 * Отправляет уведомление о запросе дружбы
 */
export async function notifyFriendRequest(senderId: string, receiverId: string) {
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { username: true, nickname: true },
  });

  if (!sender) return;

  const displayName = sender.nickname || sender.username;

  await createNotification({
    userId: receiverId,
    type: NotificationType.FRIEND_REQUEST,
    title: "Запрос дружбы",
    message: `${displayName} отправил вам запрос дружбы`,
    fromUserId: senderId,
  });
}

/**
 * Отправляет уведомление о принятии запроса дружбы
 */
export async function notifyFriendAccepted(accepterId: string, requesterId: string) {
  const accepter = await prisma.user.findUnique({
    where: { id: accepterId },
    select: { username: true, nickname: true },
  });

  if (!accepter) return;

  const displayName = accepter.nickname || accepter.username;

  await createNotification({
    userId: requesterId,
    type: NotificationType.FRIEND_ACCEPTED,
    title: "Запрос принят",
    message: `${displayName} принял ваш запрос дружбы`,
    fromUserId: accepterId,
  });
}

/**
 * Отправляет уведомление о новом сообщении
 */
export async function notifyNewMessage(
  senderId: string,
  receiverId: string,
  messagePreview: string,
  chatId: string
) {
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { username: true, nickname: true },
  });

  if (!sender) return;

  const displayName = sender.nickname || sender.username;

  await createNotification({
    userId: receiverId,
    type: NotificationType.MESSAGE,
    title: "Новое сообщение",
    message: `${displayName}: ${messagePreview.substring(0, 50)}${messagePreview.length > 50 ? "..." : ""}`,
    fromUserId: senderId,
    metadata: { chatId },
  });
}

/**
 * Отправляет уведомление о создании приложения
 */
export async function notifyAppCreated(userId: string, appName: string, appHandle: string) {
  await createNotification({
    userId,
    type: NotificationType.APP_CREATED,
    title: "Приложение создано",
    message: `Ваше приложение "${appName}" успешно создано`,
    metadata: { appHandle },
  });
}

/**
 * Отправляет уведомление об успешном деплое
 */
export async function notifyAppDeployed(userId: string, appName: string, appHandle: string, url: string) {
  await createNotification({
    userId,
    type: NotificationType.APP_DEPLOYED,
    title: "Приложение задеплоено",
    message: `Ваше приложение "${appName}" успешно задеплоено и доступно по адресу ${url}`,
    metadata: { appHandle, url },
  });
}

/**
 * Отправляет уведомление об ошибке деплоя
 */
export async function notifyAppFailed(userId: string, appName: string, appHandle: string, error: string) {
  await createNotification({
    userId,
    type: NotificationType.APP_FAILED,
    title: "Ошибка деплоя",
    message: `Не удалось задеплоить приложение "${appName}": ${error}`,
    metadata: { appHandle },
  });
}

/**
 * Отправляет системное уведомление
 */
export async function notifySystem(userId: string, title: string, message: string) {
  await createNotification({
    userId,
    type: NotificationType.SYSTEM,
    title,
    message,
  });
}

/**
 * Массовая отправка уведомлений
 */
export async function notifyMultipleUsers(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  fromUserId?: string
) {
  const notifications = await Promise.all(
    userIds.map((userId) =>
      createNotification({
        userId,
        type,
        title,
        message,
        fromUserId,
      })
    )
  );

  return notifications;
}
