type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "soft" | "danger";
  disabled?: boolean;
};

function CuteButton({
  children,
  onClick,
  type = "button",
  variant = "soft",
  disabled,
}: Props) {
  return (
    <button
      className={`cute-button ${variant}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default CuteButton;