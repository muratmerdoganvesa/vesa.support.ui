type LinkedInMediaIconProps = {
  className?: string;
};

export const LinkedInMediaIcon = ({ className = "h-3.5 w-3.5" }: LinkedInMediaIconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M7.5 8.5h2.7v9H7.5v-9zm1.35-4.5a1.58 1.58 0 1 1 0 3.16 1.58 1.58 0 0 1 0-3.16zM11 8.5h2.59v1.23h.04c.36-.68 1.24-1.4 2.55-1.4 2.73 0 3.23 1.8 3.23 4.13v4.64H16.8v-4.12c0-.98-.02-2.24-1.44-2.24-1.4 0-1.61 1.09-1.61 2.21v4.15H11V8.5z" />
  </svg>
);
