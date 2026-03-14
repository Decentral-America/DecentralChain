import Prism from 'prismjs';

interface Props {
  code: string;
  language: string;
}

export function Highlight({ code, language }: Props) {
  return (
    <code
      className={`language-${language}`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: highlight component sanitizes input via Prism
      dangerouslySetInnerHTML={{
        __html: Prism.highlight(code, Prism.languages[language], language),
      }}
    />
  );
}
