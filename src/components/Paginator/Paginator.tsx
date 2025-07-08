export const Paginator = ({
  pages,
  onPageChange,
  page,
}: {
  pages: number
  onPageChange: (num: number) => void
  page: number
}) => {
  return (
    <div style={{ marginTop: 20 }}>
      {Array.from({ length: pages }, (_, i) => i + 1).map((num) => (
        <button
          key={num}
          disabled={num === page}
          onClick={() => onPageChange(num)}
          style={{
            marginRight: 5,
            padding: "5px 10px",
            fontWeight: num === page ? "bold" : "normal",
            cursor: num === page ? "default" : "pointer",
          }}
        >
          {num}
        </button>
      ))}
    </div>
  )
}
