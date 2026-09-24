export default function ExternalLink({ children, href, icon = true, ...props }) {
  return (
    <a href={href} {...props} target="_blank" rel="noreferrer">
      {children}
      {icon ? <span className="external-link__icon ml-0.5 text-[0.85em] text-muted" aria-hidden="true">↗</span> : null}
    </a>
  );
}
