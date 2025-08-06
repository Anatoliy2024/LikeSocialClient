"use client"
import ButtonMenu from "@/components/ui/button/Button"
import style from "./PostsBlock.module.scss"
import { useEffect, useState } from "react"

// import { RootState } from "@/store/store"
// import { useAppSelector } from "@/store/hooks"
// import { getUserPostsThunk } from "@/store/thunks/userPostThunks"
import Post from "@/components/post/Post"
import { useParams, useRouter, usePathname } from "next/navigation"
import PostModal from "@/components/postModal/PostModal"
import { useSearchParams } from "next/navigation"
import { userPostType } from "@/store/slices/userPostsSlice"
import { Paginator } from "../Paginator/Paginator"
import PostForm from "@/components/postForm/PostForm"

type PostsBlockProps = {
  posts: userPostType[]
  userId: string | undefined | null
  isProfile: boolean
  page: number
  pages: number
  onPageChange: (page: number) => void
  loading: boolean
  isOwner?: boolean
}

const PostsBlock = ({
  posts,
  userId,
  isProfile,
  page,
  pages,
  onPageChange,
  loading,
  isOwner,
}: PostsBlockProps) =>
  //  {
  //   posts: userPostType[]
  //   userId: string | undefined
  //   isProfile: boolean
  // }
  {
    const [activeCreateNewPost, setActiveCreateNewPost] = useState(false)
    // console.log("pages", pages)
    // const playerId = useAppSelector((state: RootState) => state.auth.userId)

    const pathname = usePathname()
    // const { id } = useParams<{ id: string }>()

    const params = useParams<{ id: string }>()

    // if (!params || !params.id) {
    //   // можно показать заглушку, редирект или бросить ошибку
    //   throw new Error("Параметр id не найден")
    // }

    const id = params?.id || null

    const isRoomPage = pathname?.includes("/room")
    const isProfilePage = pathname?.includes("/profile")

    const roomId = isRoomPage ? id : null
    const profileUserId = isProfilePage ? id : null

    const router = useRouter()
    const searchParams = useSearchParams()

    const postId = searchParams?.get("postId")
    // console.log("postId", postId)
    // const selectedPost = posts.find((post) => post._id === postId)
    const selectedPost = Array.isArray(posts)
      ? posts.find((post) => post._id === postId)
      : null
    // console.log("selectedPost", selectedPost)
    // const isMyPost = !userId || playerId === userId

    const openPostModal = (id: string) => {
      const searchParams = new URLSearchParams()
      searchParams.set("postId", id)
      // console.log("searchParams", searchParams)

      const url = roomId
        ? `/room/${roomId}?${searchParams.toString()}`
        : profileUserId
        ? `/profile/${profileUserId}?${searchParams.toString()}`
        : `/profile?${searchParams.toString()}`

      router.push(url, { scroll: false }) // <--- ВАЖНО!
    }
    const closeModal = () => {
      const url = roomId
        ? `/room/${roomId}`
        : profileUserId
        ? `/profile/${profileUserId}`
        : `/profile?`

      router.push(url, { scroll: false })
    }
    useEffect(() => {
      if (selectedPost) {
        document.body.classList.add("no-scroll")
      } else {
        document.body.classList.remove("no-scroll")
      }

      return () => {
        document.body.classList.remove("no-scroll")
      }
    }, [selectedPost])

    return (
      <>
        <div className={style.wrapper}>
          {/* <h2>PostsBlock</h2> */}

          <ButtonMenu
            onClick={() => {
              setActiveCreateNewPost(true)
            }}
          >
            Add new post
          </ButtonMenu>

          {activeCreateNewPost && (
            <PostForm
              isProfile={isProfile}
              roomId={roomId}
              hiddenBlock={() => {
                setActiveCreateNewPost(false)
              }}
            />
          )}
          {pages > 1 && (
            <Paginator pages={pages} onPageChange={onPageChange} page={page} />
          )}
          <div className={style.containerPosts}>
            {posts.length > 0
              ? posts
                  .filter((post) => {
                    if (!post || !post._id) {
                      console.warn("Пост без _id:", post)
                      return false
                    }
                    return true
                  })
                  .map((post) => {
                    // console.log("post._id", post._id)
                    if (!post._id) {
                      console.warn("Пост без _id:", post)
                    }
                    const isMyPost =
                      post.authorId._id === userId || isOwner || false
                    // console.log("isMyPost", isMyPost)
                    // console.log(" post.authorId._id", post.authorId._id)
                    // console.log("userId", userId)
                    // console.log("isOwner", isOwner)
                    return (
                      <Post
                        key={post._id}
                        title={post.title}
                        content={post.content}
                        authorName={post.authorId.username}
                        ratings={post.ratings}
                        createdAt={post.createdAt}
                        id={post._id}
                        isMyPost={isMyPost}
                        avatar={post.avatar}
                        isProfile={isProfile}
                        roomId={roomId}
                        genres={post.genres}
                        onClick={() => openPostModal(post._id)}
                        comments={post.comments}
                        votesCount={post.votesCount}
                        // avatarPublicId={post.avatarPublicId}
                        page={page}
                      />
                    )
                  })
              : null}
          </div>

          {loading && <p>Загрузка...</p>}
        </div>
        {selectedPost && (
          <PostModal
            post={selectedPost}
            playerId={userId as string}
            onClose={() => {
              closeModal()
            }}
          />
        )}
      </>
    )
  }

export default PostsBlock
