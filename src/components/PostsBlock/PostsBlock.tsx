"use client"
import ButtonMenu from "@/components/ui/button/Button"
import style from "./PostsBlock.module.scss"
import { useEffect, useState } from "react"
import CreatePost from "@/components/createPost/CreatePost"
import { RootState } from "@/store/store"
import { useAppSelector } from "@/store/hooks"
// import { getUserPostsThunk } from "@/store/thunks/userPostThunks"
import Post from "@/components/post/Post"
import { useParams, useRouter, usePathname } from "next/navigation"
import PostModal from "@/components/postModal/PostModal"
import { useSearchParams } from "next/navigation"
import { userPostType } from "@/store/slices/userPostsSlice"
const PostsBlock = ({
  posts,
  userId,
  isProfile,
}: {
  posts: userPostType[]
  userId: string
  isProfile: boolean
}) => {
  const [activeCreateNewPost, setActiveCreateNewPost] = useState(false)
  const playerId = useAppSelector((state: RootState) => state.auth.userId)
  const pathname = usePathname()
  const { id } = useParams<{ id: string }>()

  const isRoomPage = pathname.includes("/room")
  const isProfilePage = pathname.includes("/profile")

  const roomId = isRoomPage ? id : null
  const profileUserId = isProfilePage ? id : null

  const router = useRouter()
  const searchParams = useSearchParams()

  const postId = searchParams.get("postId")
  // console.log("postId", postId)
  const selectedPost = posts.find((post) => post._id === postId)
  // console.log("selectedPost", selectedPost)
  const isMyPost = !userId || playerId === userId

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
        <h2>PostsBlock</h2>

        {isMyPost && (
          <ButtonMenu
            onClick={() => {
              setActiveCreateNewPost(true)
            }}
          >
            Add new post
          </ButtonMenu>
        )}
        {activeCreateNewPost && (
          <CreatePost
            isProfile={isProfile}
            roomId={roomId}
            hiddenBlock={() => {
              setActiveCreateNewPost(false)
            }}
          />
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
                  console.log("post._id", post._id)
                  if (!post._id) {
                    console.warn("Пост без _id:", post)
                  }
                  return (
                    <Post
                      key={post._id}
                      title={post.title}
                      content={post.content}
                      authorName={post?.authorName || ""}
                      ratings={post.ratings}
                      createdAt={post.createdAt}
                      id={post._id}
                      isMyPost={isMyPost}
                      imagePost={post.imagePost}
                      isProfile={isProfile}
                      roomId={roomId}
                      genres={post.genres}
                      onClick={() => openPostModal(post._id)}
                      comments={post.comments}
                      votesCount={post.votesCount}
                    />
                  )
                })
            : null}
        </div>
      </div>
      {selectedPost && (
        <PostModal
          post={selectedPost}
          playerId={playerId as string}
          onClose={() => {
            closeModal()
          }}
        />
      )}
    </>
  )
}

export default PostsBlock
