export const FireIcon = ({
  showNotifications,
}: {
  showNotifications: boolean
}) => {
  return (
    <svg
      width="35"
      height="35"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_0_3041)">
        <path
          d="M27 1.33984C27 1.33984 28.48 6.63984 28.48 10.9398C28.48 15.0598 25.78 18.4098 21.65 18.4098C17.52 18.4098 14.4 15.0698 14.4 10.9398L14.45 10.2198C10.43 15.0298 8 21.2298 8 27.9998C8 36.8398 15.16 43.9998 24 43.9998C32.84 43.9998 40 36.8398 40 27.9998C40 17.2098 34.81 7.58984 27 1.33984ZM23.42 37.9998C19.86 37.9998 16.97 35.1898 16.97 31.7198C16.97 28.4698 19.06 26.1898 22.6 25.4798C26.14 24.7698 29.8 23.0698 31.83 20.3298C32.61 22.9098 33.02 25.6298 33.02 28.3998C33.02 33.6898 28.72 37.9998 23.42 37.9998Z"
          fill={showNotifications ? "currentColor" : "#ff7745"}
        />
      </g>
      <defs>
        <clipPath id="clip0_0_3041">
          <rect width="48" height="48" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
