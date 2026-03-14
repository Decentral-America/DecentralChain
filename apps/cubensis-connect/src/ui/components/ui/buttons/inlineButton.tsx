interface Props
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  onClick: () => void;
}

/*
 * NOTE:
 * This component is needed to allow text inside the button to wrap, like simple
 * text of inline elements, to use it inside e.g. error messages
 */
export function InlineButton({ onClick, ...otherProps }: Props) {
  return (
    <button
      type="button"
      {...otherProps}
      onClick={() => {
        onClick();
      }}
    />
  );
}
