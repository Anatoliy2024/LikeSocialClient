"use client"
import { useParams } from "next/navigation"
import style from "./MessageBlock.module.scss"
import { CloudinaryImage } from "../CloudinaryImage/CloudinaryImage"
import Spinner from "../ui/spinner/Spinner"
import { formatMessageTime } from "@/utils/formatMessageTime"
import ConfirmModal from "../ConfirmModal/ConfirmModal"
import Image from "next/image"
import { MessageReactions } from "../MessageReactions/MessageReactions"
import { MessageModal } from "../MessageModal/MessageModal"
import { getStickerImage } from "@/utils/getStickerImage"
import { MessageBlockInput } from "../MessageBlockInput/MessageBlockInput"
import { MessageText } from "../MessageText/MessageText"
import { useMessageBlock } from "@/hooks/useMessageBlock/useMessageBlock"
import { MessageBlockHeader } from "../MessageBlockHeader/MessageBlockHeader"

export const MessageBlock = () => {
  const params = useParams<{ id: string }>()
  if (!params || !params.id) throw new Error("Параметр id не найден")
  const id = params.id
  const {
    currentConversation,
    loading,
    activeMessage,
    messagePosition,
    isGroup,
    handleCloseCurrentMessage,
    handleReaction,
    handleDeleteMessage,
    handleShowEditMessage,
    fullImage,
    setFullImage,
    confirmConfig,
    closeConfirm,
    recipientId,
    userId,
    usersOnline,
    status,
    optionRef,
    setShowOption,
    showOption,
    isOwner,
    setConfirmConfig,
    delConversation,
    delHistoryMessages,
    messagesContainerRef,
    hasMoreOlder,
    topSentinelRef,
    messages,
    initialLastReadIdRef,
    firstUnreadMessageId,
    dividerRef,
    handleCurrentMessage,
    messagesEndRef,
    isAtBottom,
    scrollToBottom,
    isEditMessage,
    handleCloseEditMessage,
  } = useMessageBlock(id)
  // console.log("рендер")
  if (!currentConversation && loading) {
    return (
      <div style={{ paddingTop: "50px" }}>
        <Spinner />
      </div>
    )
  }

  if (!currentConversation) return <div>Беседа не найдена</div>

  return (
    <div className={style.messageBlock}>
      {activeMessage && messagePosition && (
        <MessageModal
          message={activeMessage}
          position={messagePosition}
          isGroup={isGroup}
          onClose={handleCloseCurrentMessage}
          handleReaction={handleReaction}
          handleDeleteMessage={handleDeleteMessage}
          handleShowEditMessage={handleShowEditMessage}
        />
      )}

      {fullImage && (
        <div
          onClick={() => setFullImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            cursor: "zoom-out",
          }}
        >
          <CloudinaryImage
            src={fullImage}
            alt="full"
            width={1200}
            height={1200}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              width: "auto",
              height: "auto",
              borderRadius: "8px",
            }}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmConfig}
        onCancel={closeConfirm}
        onConfirm={() => {
          confirmConfig?.onConfirm()
          closeConfirm()
        }}
        title={confirmConfig?.title}
        message={confirmConfig?.message}
      />

      {/* ── Шапка ── */}
      <MessageBlockHeader
        isGroup={isGroup}
        id={id}
        currentConversation={currentConversation}
        recipientId={recipientId}
        userId={userId}
        usersOnline={usersOnline}
        status={status}
        optionRef={optionRef}
        setShowOption={setShowOption}
        showOption={showOption}
        isOwner={isOwner}
        delConversation={delConversation}
        delHistoryMessages={delHistoryMessages}
        setConfirmConfig={setConfirmConfig}
      />

      {/* ── Список сообщений ── */}
      <div
        className={style.messageBlock__contentMessageBlock}
        ref={messagesContainerRef}
      >
        {/* 🔥 Sentinel для автоподгрузки старых сообщений (вместо кнопки) */}
        {hasMoreOlder && <div ref={topSentinelRef} style={{ height: 1 }} />}

        {messages.length > 0 && (
          <div className={style.messageBlock__messagesList}>
            {loading && <Spinner />}
            {messages.map((message) => {
              const isUnread =
                message.senderId._id !== userId &&
                !!initialLastReadIdRef.current &&
                message._id > initialLastReadIdRef.current

              const isFirstUnread = message._id === firstUnreadMessageId

              return (
                <div key={message._id}>
                  {isFirstUnread && (
                    <div
                      ref={dividerRef}
                      className={style.messageBlock__unreadDivider}
                    >
                      <span>Новые сообщения</span>
                    </div>
                  )}

                  <div
                    className={style.messageBlock__messageListWrapper}
                    data-message-id={message._id}
                    data-unread={String(isUnread)}
                    onClick={(e) =>
                      handleCurrentMessage(
                        message._id,
                        message.senderId._id === userId,
                        e,
                      )
                    }
                  >
                    {isGroup && message.senderId._id !== userId && (
                      <div className={style.messageBlock__senderImage}>
                        <CloudinaryImage
                          src={message.senderId.avatar}
                          alt="avatar"
                          width={200}
                          height={200}
                        />
                      </div>
                    )}
                    <div
                      className={`${style.messageBlock__messageList} ${
                        message.senderId._id !== userId
                          ? style.messageBlock__recipient
                          : style.messageBlock__me
                      } ${isUnread ? style.messageBlock__unread : ""}`}
                    >
                      {message.type === "image" &&
                        message.attachments?.map((att) => (
                          <CloudinaryImage
                            key={att.url}
                            src={att.url}
                            alt="image"
                            width={400}
                            height={400}
                            style={{
                              maxWidth: "250px",
                              borderRadius: "8px",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              if (e) e.stopPropagation()
                              setFullImage(att.url)
                            }}
                          />
                        ))}
                      {message.type === "sticker" && message.sticker && (
                        <Image
                          src={
                            getStickerImage(message.sticker) ||
                            "/stickers/not-found.png"
                          }
                          width={200}
                          height={200}
                          alt={message._id}
                        />
                      )}

                      {message.text && (
                        <div className={style.messageBlock__messageListText}>
                          <MessageText text={message.text} />

                          {/* {message.text} */}
                        </div>
                      )}

                      <div className={style.messageBlock__otherInfoMessage}>
                        <MessageReactions
                          reactions={message.reactions}
                          messageId={message._id}
                          handleReaction={handleReaction}
                        />
                        <div
                          className={style.messageBlock__otherInfoMessageTest}
                        >
                          {message.isEdited && <span>изменено</span>}
                          <span>{formatMessageTime(message.createdAt)}</span>
                          {message.senderId._id === userId && (
                            <span className={style.messageBlock__readStatus}>
                              {message.readCount > 0 ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Якорь для скролла вниз */}
        <div ref={messagesEndRef} />
      </div>
      {!isAtBottom && (
        <button
          className={style.messageBlock__scrollToBottom}
          onClick={scrollToBottom}
        >
          ↓ Вниз
        </button>
      )}

      {/* ── Инпут ── */}
      <MessageBlockInput
        id={id}
        isEditMessage={isEditMessage}
        messagesEndRef={messagesEndRef}
        handleCloseEditMessage={handleCloseEditMessage}
      />
    </div>
  )
}
