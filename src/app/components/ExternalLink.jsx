export default function ExternalLink({ children, href, ...props }) {
  return (
    <a href={href} {...props} target="_blank" rel="noreferrer">
      {children}
      <span className="external-link__icon" aria-hidden="true">↗</span>
    </a>
  );
}
