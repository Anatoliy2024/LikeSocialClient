import { TRACKERS, VIDEO_EXTENSIONS } from "@/constants/webTorrentConfig"
import {
  clearCinemaHall,
  getPeerId,
  joinUser,
  leftUser,
  setCinemaHall,
} from "@/store/slices/cinemaHallSlice"
import { AppDispatch } from "@/store/store"
import {
  CinemaHallTargetType,
  ParticipantsType,
} from "@/types/cinemaHall.types"
import {
  TorrentFile,
  TorrentInstance,
  TorrentStatus,
  WebTorrentInstance,
} from "@/types/webtorrent.types"
import { waitForClient } from "@/utils/waitForClient"
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
} from "react"
import { Socket } from "socket.io-client"

interface JoinHallResponse {
  hall: CinemaHallTargetType
  error?: string
}

export const useSocketCinemaHall = (
  socket: Socket | null,
  id: string,
  dispatch: AppDispatch,
  groupId: string,
  activate: () => void,
  setTorrentStatus: Dispatch<SetStateAction<TorrentStatus>>,
  setFailedTracker: Dispatch<SetStateAction<string | undefined>>,
  clientRef: RefObject<WebTorrentInstance | null>,
  torrentRef: RefObject<TorrentInstance | null>,
  torrentInfoHashRef: RefObject<string | null>,
  peerCheckRef: RefObject<ReturnType<typeof setInterval> | null>,
  lastLoggedProgress: RefObject<number>,
  setBufferProgress: Dispatch<SetStateAction<number>>,
  // setBufferingStatus: Dispatch<SetStateAction<boolean>>,
  videoRef: RefObject<HTMLVideoElement | null>,
  avatar?: string | null,
  username?: string | null,
) => {
  const setupTorrentPlayer = useCallback(
    (
      torrent: TorrentInstance,
      existingPeerIds: string[] = [],
      onReady?: () => void,
    ) => {
      // 1. Сначала очищаем старые слушатели, если торрент уже использовался
      torrent.removeAllListeners()

      torrentRef.current = torrent
      torrentInfoHashRef.current = torrent.infoHash

      existingPeerIds.forEach((peerId) => {
        console.log("🔗 Добавляем пира:", peerId)
        const result = torrent.addPeer(peerId)
        console.log("🔗 addPeer результат:", result) // true/false — сработало или нет
      })

      // Отладка пиров
      peerCheckRef.current = setInterval(() => {
        if (!torrentRef.current && peerCheckRef.current) {
          clearInterval(peerCheckRef.current)
          return
        }
        console.log(`🔍 Пиров: ${torrent.numPeers}`)
      }, 5000)

      torrent.on("metadata", () => {
        console.log(
          "📦 Метаданные:",
          torrent.name,
          torrent.files?.length,
          "файлов",
        )
      })
      torrent.on("download", () => {
        const percent = Math.round(torrent.progress * 100)
        if (percent % 5 === 0 && percent !== lastLoggedProgress.current) {
          lastLoggedProgress.current = percent
          console.log(
            `📥 ${percent}% | пиров: ${torrent.numPeers} | ${(torrent.downloadSpeed / 1024).toFixed(1)} KB/s`,
          )
        }
        setBufferProgress(percent)
        if (percent < 100) {
          setTorrentStatus("buffering")
        } else {
          setTorrentStatus("done")
        }
        // setBufferingStatus(percent < 100)
      })
      torrent.on("done", () => {
        // console.log("✅ done сработал*********************************")
        setBufferProgress(100)
        // setBufferingStatus(false)
        setTorrentStatus("done")
      })

      // @ts-ignore
      torrent.on("wire", (wire, addr: string) => {
        // console.log(`🔗 Пир: ${addr}, тип: ${wire.type}`)
        console.log(
          `✅ СОЕДИНЕНИЕ УСТАНОВЛЕНО! Пир: ${addr}, тип: ${wire.type}, peerId: ${wire.peerId}`,
        )
        setTorrentStatus("peer_search")
        if (peerCheckRef.current) {
          clearInterval(peerCheckRef.current)
        }
      })

      torrent.on("noPeers", () => {
        // console.warn("⚠️ Нет пиров")
        console.warn("❌ Нет пиров — addPeer не сработал")
      })

      // torrent.on("warning", (err) => {
      //   console.warn("⚠️", err)
      //   if (peerCheckRef.current) {
      //     clearInterval(peerCheckRef.current)
      //   }
      // })
      // torrent.on("error", (err) => {
      //   console.error("❌", err)
      //   setTorrentStatus("error")
      //   if (peerCheckRef.current) {
      //     clearInterval(peerCheckRef.current)
      //   }
      // })
      torrent.on("warning", (err) => {
        console.warn("⚠️", err)
        // const msg = String(err?.message ?? err ?? "")
        const msg = err instanceof Error ? err.message : String(err)
        const failedUrl = TRACKERS.find((t) => msg.includes(t))
        if (failedUrl) {
          setFailedTracker(failedUrl)
          setTorrentStatus("tracker_partial")
          // если это был последний — проверим через секунду
        }
        if (peerCheckRef.current) clearInterval(peerCheckRef.current)
      })
      torrent.on("error", (err) => {
        console.error("❌", err)
        // setTorrentStatus("error")
        setTorrentStatus("tracker_failed")
        if (peerCheckRef.current) clearInterval(peerCheckRef.current)
      })

      const startPlayer = () => {
        // console.log("=== DEBUG: Torrent Ready ===")
        // console.log("Name:", torrent.name)
        // console.log("Progress:", torrent.progress)
        // console.log("Downloaded:", torrent.downloaded, "of", torrent.length)

        const videoFile = (torrent.files as TorrentFile[]).find((f) =>
          VIDEO_EXTENSIONS.some((ext) => f.name.endsWith(ext)),
        )

        if (!videoFile) {
          console.error("Видеофайл не найден в торренте")
          setTorrentStatus("error")
          return
        }
        // console.log("videoRef.current", videoRef.current)
        if (!videoRef.current) return

        // console.log(
        //   "videoFile?.streamTo изменение на ready",
        //   !!videoFile?.streamTo,
        // )
        if (videoFile?.streamTo) {
          try {
            videoFile?.streamTo(videoRef.current)
            // setTorrentStatus("done")
            onReady?.() // ✅ activate() вызывается здесь — видео уже имеет src
          } catch (e) {
            console.error("Stream error:", e)
            setTorrentStatus("error")
          }
        } else {
          console.warn("⚠️ streamTo не определён")
          setTorrentStatus("error")
        }
      }
      // 🎯 ГЛАВНЫЙ ФИКС: Проверяем, не готов ли торрент УЖЕ СЕЙЧАС
      if (torrent.ready) {
        // console.log("⚡ Торрент УЖЕ готов, запускаем плеер немедленно")
        startPlayer()
      } else {
        // Иначе ждём событие ready как обычно
        // console.log("⏳ Ждём события ready...")
        torrent.on("ready", () => {
          // console.log("✅ Событие ready сработало")
          startPlayer()
        })
      }
    },
    [
      setTorrentStatus,
      setBufferProgress,
      // setBufferingStatus,
      setFailedTracker,
      videoRef,
    ],
  )

  const connectMagnet = useCallback(
    async (
      client: WebTorrentInstance,
      magnet: string,
      existingPeerIds: string[] = [],
      onReady?: () => void,
    ) => {
      // console.log("connectMagnet:", magnet)

      // 1. Парсим infoHash из magnet ссылки (формат: ...btih:HASH&...)
      const hashMatch = magnet.match(/btih:([a-zA-Z0-9]+)/)
      if (!hashMatch) {
        console.error("Не удалось извлечь infoHash из magnet")
        return
      }
      const infoHash = hashMatch[1]

      // 2. Проверяем, не качаем ли мы это уже
      const existing = client.torrents.find(
        (t: TorrentInstance) => t.infoHash === infoHash,
      )

      if (existing) {
        // console.log("✅ Торрент уже добавлен, используем существующий")
        setupTorrentPlayer(existing, existingPeerIds, onReady)
        return
      }

      // 3. Добавляем новый
      const torrent = client.add(magnet, { announce: TRACKERS })

      if (torrent.ready) {
        setupTorrentPlayer(torrent, existingPeerIds, onReady)
      } else {
        torrent.on("ready", () =>
          setupTorrentPlayer(torrent, existingPeerIds, onReady),
        )
      }
    },
    [setupTorrentPlayer],
  )

  useEffect(() => {
    if (!socket || !id) return

    socket.emit(
      "cinema-hall:join",
      { cinemaHallId: id, groupId, username, avatar },
      async (data: JoinHallResponse) => {
        if (data.error) {
          console.error(data.error)
          return
        }

        dispatch(setCinemaHall(data.hall))
        // activate()
        // Зритель: если в зале уже есть magnet — подключаемся
        if (data.hall?.file?.magnet) {
          try {
            // setMagnetURI(data.hall?.file?.magnet)
            setTorrentStatus("tracker_connecting")

            const client = await waitForClient(clientRef)
            // const client = await waitForClient(clientRef, ac.signal)

            await connectMagnet(client, data.hall.file.magnet, [], activate)
            socket.emit("cinema-hall:set-peer-id", {
              cinemaHallId: id,
              groupId,
              peerId: client.peerId,
            })
          } catch (err) {
            console.error("Ошибка подключения:", err)
            setTorrentStatus("error")
          }
        }
      },
    )

    const handleUnload = () => {
      socket.emit("cinema-hall:leave", { cinemaHallId: id, groupId })
    }
    window.addEventListener("beforeunload", handleUnload)

    return () => {
      // abortControllerRef.current?.abort()
      window.removeEventListener("beforeunload", handleUnload)
      socket.emit("cinema-hall:leave", { cinemaHallId: id, groupId })
      dispatch(clearCinemaHall())
    }
  }, [socket, id, groupId, dispatch, connectMagnet, setTorrentStatus])

  useEffect(() => {
    if (!socket) return
    const joinUserHandler = (data: ParticipantsType) => {
      dispatch(joinUser(data))
    }
    const leftUserHandler = (data: { userId: string }) => {
      dispatch(leftUser(data.userId))
    }
    socket?.on("cinema-hall:user-joined", joinUserHandler)
    socket?.on("cinema-hall:user-left", leftUserHandler)

    return () => {
      socket?.off("cinema-hall:user-joined", joinUserHandler)
      socket?.off("cinema-hall:user-left", leftUserHandler)
    }
  }, [socket, dispatch])

  useEffect(() => {
    if (!socket) return
    const getPeerIdHandler = (data: { user: ParticipantsType }) => {
      dispatch(getPeerId(data.user))

      // ← НОВОЕ: если мы хост и у нас есть торрент — добавляем пира напрямую
      // const torrent = torrentRef.current
      // if (!torrent) return
    }
    socket.on("cinema-hall:get-peer-id", getPeerIdHandler)

    return () => {
      socket.off("cinema-hall:get-peer-id", getPeerIdHandler)
    }
  }, [socket, dispatch])

  useEffect(() => {
    return () => {
      if (peerCheckRef.current) {
        clearInterval(peerCheckRef.current)
        peerCheckRef.current = null
      }
    }
  }, [])
}
