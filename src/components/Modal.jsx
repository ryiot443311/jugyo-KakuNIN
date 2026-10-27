export default function Modal({ children }) {
  return (
    <div className="overlay">
      <div className="modal" role="dialog" aria-modal="true">{children}</div>
    </div>
  );
}
